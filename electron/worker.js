const { parentPort, workerData } = require('worker_threads');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { TEMP_PATHS, logger, createTempDir } = require('./utils');
const ffmpeg = require('fluent-ffmpeg');
let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
let ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Corrige o caminho do ffmpeg para o ambiente de produção (empacotado)
if (workerData.isPackaged) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
  ffprobePath = ffprobePath.replace('app.asar', 'app.asar.unpacked');
}

// Configura os caminhos para o ffmpeg e ffprobe
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



// --- Implementações das Tarefas ---

/**
 * Executa a tarefa de cortar um vídeo.
 * @param {object} options - Opções da tarefa.
 * @returns {Promise<string>} O caminho para o arquivo de vídeo cortado.
 */
async function runCutTask({ videoPath, startTime, endTime }) {
    const tempDir = createTempDir(TEMP_PATHS.CUTS);
    logger.temp('Using temp dir for cuts', tempDir);
    const outputFormat = path.extname(videoPath);
    const fsPromises = require('fs').promises;

    const start = parseFloat(startTime);
    const end = parseFloat(endTime);

    if (isNaN(start) || isNaN(end) || end <= start) {
        throw new Error(`Parâmetros de exclusão inválidos: startTime=${start}, endTime=${end}`);
    }

    const part1Path = path.join(tempDir, `part1-${Date.now()}${outputFormat}`);
    const part2Path = path.join(tempDir, `part2-${Date.now()}${outputFormat}`);
    const concatListPath = path.join(tempDir, `concat-list-${Date.now()}.txt`);
    const outputFileName = `excised-${Date.now()}-${path.basename(videoPath, outputFormat)}${outputFormat}`;
    const outputPath = path.join(tempDir, outputFileName);

    try {
        // Etapa 1: Criar a primeira parte do vídeo (início até o corte)
        console.log(`🎬 Worker - Etapa 1: Criando parte 1 (0s a ${start}s)`);
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .setDuration(start)
                .output(part1Path)
                .withVideoCodec('copy')
                .withAudioCodec('copy')
                .on('end', resolve)
                .on('error', (err) => {
                    logger.error('FFmpeg Error - Etapa 1 (part1)', err, { videoPath, startTime, part1Path });
                    reject(new Error(`Erro na Etapa 1: ${err.message}`));
                })
                .run();
        });
        console.log('✅ Worker: Parte 1 criada:', part1Path);

        // Etapa 2: Criar a segunda parte do vídeo (fim do corte até o final)
        console.log(`🎬 Worker - Etapa 2: Criando parte 2 (${end}s até o fim)`);
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .setStartTime(end)
                .output(part2Path)
                .withVideoCodec('copy')
                .withAudioCodec('copy')
                .on('end', resolve)
                .on('error', (err) => {
                    logger.error('FFmpeg Error - Etapa 2 (part2)', err, { videoPath, endTime, part2Path });
                    reject(new Error(`Erro na Etapa 2: ${err.message}`));
                })
                .run();
        });
        console.log('✅ Worker: Parte 2 criada:', part2Path);

        // Etapa 3: Criar arquivo de lista para concatenação
        const fileList = `file '${part1Path.replace(/\\/g, '/')}'\nfile '${part2Path.replace(/\\/g, '/')}'`;
        await fsPromises.writeFile(concatListPath, fileList);
        console.log('✅ Worker: Arquivo de concatenação criado.');

        // Etapa 4: Concatenar as duas partes
        console.log('🎬 Worker - Etapa 4: Concatenando as partes');
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(concatListPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions('-c', 'copy')
                .output(outputPath)
                .on('end', resolve)
                .on('error', (err) => {
                    logger.error('FFmpeg Error - Etapa 4 (concat)', err, { concatListPath, outputPath });
                    reject(new Error(`Erro na Etapa 4: ${err.message}`));
                })
                .run();
        });
        console.log('✅ Worker: Concatenação finalizada:', outputPath);

        return outputPath;

    } finally {
        // Etapa 5: Limpar arquivos temporários
        logger.temp('Cleaning temporary files', tempDir);
        try {
            await fsPromises.unlink(part1Path);
            await fsPromises.unlink(part2Path);
            await fsPromises.unlink(concatListPath);
            logger.temp('Cleanup complete', tempDir);
        } catch (cleanupError) {
            logger.error('Cleanup failed', cleanupError, { tempDir });
        }
    }
}

/**
 * Executa a tarefa de aplicar um overlay de imagem em um vídeo.
 * @param {object} options - Opções da tarefa.
 * @returns {Promise<string>} O caminho para o vídeo processado.
 */
function runOverlayTask({ videoPath, imagePath, x, y, width, height, videoQuality }) {
    const tempDir = createTempDir(TEMP_PATHS.OVERLAYS);
    logger.temp('Using temp dir for overlays', tempDir);
    const outputFileName = `overlay-${Date.now()}-${path.basename(videoPath)}`;
    const outputPath = path.join(tempDir, outputFileName);

    // Mapeia a configuração de qualidade para parâmetros do FFmpeg
    const qualityParams = {
        draft: { crf: '28', preset: 'ultrafast' },
        balanced: { crf: '23', preset: 'medium' },
        high: { crf: '18', preset: 'slow' }
    };
    const selectedQuality = qualityParams[videoQuality] || qualityParams.balanced;

    return new Promise((resolve, reject) => {
        const command = ffmpeg(videoPath).input(imagePath);
        const complexFilter = width && height
            ? `[1:v]scale=${width}:${height}[scaled_overlay];[0:v][scaled_overlay]overlay=x=${x}:y=${y}`
            : `[0:v][1:v]overlay=x=${x}:y=${y}`;

        command.complexFilter(complexFilter)
            .outputOptions([
                '-crf', selectedQuality.crf,
                '-preset', selectedQuality.preset
            ])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(err))
            .run();
    }).finally(() => {
        // Limpar diretório temporário após a tarefa
        logger.temp('Cleaning temporary overlay directory', tempDir);
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            logger.temp('Temporary overlay directory cleaned', tempDir);
        } catch (cleanupError) {
            logger.error('Failed to clean temporary overlay directory', cleanupError, { tempDir });
        }
    });
}

/**
 * Executa a tarefa de processamento genérico de vídeo (atualmente, um corte).
 * @param {object} options - Opções da tarefa.
 * @returns {Promise<string>} O caminho para o vídeo processado.
 */
function runProcessTask({ videoPath, options, outputFormat }) {
     return new Promise((resolve, reject) => {
        const tempDir = createTempDir(TEMP_PATHS.PROCESSED);
        logger.temp('Using temp dir for processing', tempDir);
        const inputFileName = path.basename(videoPath, path.extname(videoPath));
        const outputFileName = `processed_${Date.now()}_${inputFileName}${outputFormat}`;
        const fullOutputPath = path.join(tempDir, outputFileName);

        const command = ffmpeg(videoPath);
        if (options.startTime > 0) {
            command.seekInput(options.startTime);
        }
        if (options.endTime) {
            command.duration(options.endTime - (options.startTime || 0));
        }

        command.output(fullOutputPath)
            .on('end', () => resolve(fullOutputPath))
            .on('error', (err) => reject(err))
            .run();
    }).finally(() => {
        // Limpar diretório temporário após a tarefa
        logger.temp('Cleaning temporary processing directory', tempDir);
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            logger.temp('Temporary processing directory cleaned', tempDir);
        } catch (cleanupError) {
            logger.error('Failed to clean temporary processing directory', cleanupError, { tempDir });
        }
    });
}


/**
 * Executa a tarefa de obter informações de um vídeo com ffprobe.
 * @param {object} options - Opções da tarefa.
 * @returns {Promise<object>} As informações do vídeo.
 */
function runFfprobeTask({ videoPath }) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(new Error(`Falha ao analisar vídeo: ${err.message}`));
            }

            const videoInfo = {
                duration: parseFloat(metadata.format.duration) || 0,
                width: parseInt(metadata.streams[0]?.width || 0),
                height: parseInt(metadata.streams[0]?.height || 0),
                fps: eval(metadata.streams[0]?.r_frame_rate || 30),
                bitrate: parseInt(metadata.format.bit_rate) || 0,
                size: metadata.format.size || 0,
                format: metadata.format.format_name || 'unknown',
                codec: metadata.streams[0]?.codec_name || 'unknown',
                hasAudio: metadata.streams.some(stream => stream.codec_type === 'audio'),
            };
            resolve(videoInfo);
        });
    });
}


// --- Lógica Principal do Worker ---

parentPort.on('message', async (data) => {
    const { task, ...options } = data;
    console.log(`👷 Worker: Recebida tarefa '${task}'`);

    try {
        let result;
        switch (task) {
            case 'info':
                result = await runFfprobeTask(options);
                break;
            case 'cut':
                result = await runCutTask(options);
                break;
            case 'process-overlay':
                result = await runOverlayTask(options);
                break;
            case 'process-video':
                result = await runProcessTask(options);
                break;
              default:
                throw new Error(`Tarefa de worker desconhecida: ${task}`);
        }
        logger.temp(`Worker: Task '${task}' completed successfully. Posting message back to main process.`, { result });
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        logger.error(`Worker task '${task}' failed`, error, { task, options });
        parentPort.postMessage({ success: false, error: error.message, stack: error.stack });
    } finally {
        // O worker será encerrado no processo principal após receber a mensagem.
    }
});
