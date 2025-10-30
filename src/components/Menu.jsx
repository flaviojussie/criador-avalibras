import React, { useState, useRef, useEffect } from 'react';

const MenuItem = ({ item, onItemClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    // Efeito para lidar com cliques fora do menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Adiciona o listener apenas se o item tiver submenu
        if (item.submenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            if (item.submenu) {
                document.removeEventListener('mousedown', handleClickOutside);
            }
        };
    }, [item.submenu]);

    // Renderiza separator
    if (item.separator) {
        return <li className="menu-separator"></li>;
    }

    // Renderiza header
    if (item.header) {
        return <li className="menu-header">{item.label}</li>;
    }

    const handleClick = () => {
        if (item.submenu) {
            setIsOpen(!isOpen);
        } else {
            if (item.action) {
                item.action();
            }
            if (onItemClick) {
                onItemClick();
            }
        }
    };

    // Renderiza item de menu normal ou com submenu
    return (
        <li ref={ref}>
            <button onClick={handleClick}>
                {item.label}
            </button>
            {item.submenu && isOpen && (
                <ul className="dropdown">
                    {item.submenu.map((subItem, index) => (
                        <MenuItem key={index} item={subItem} onItemClick={() => setIsOpen(false)} />
                    ))}
                </ul>
            )}
        </li>
    );
};

const Menu = ({ items }) => {
    return (
        <nav>
            <ul className="top-menu">
                {items.map((item, index) => (
                    <MenuItem key={index} item={item} />
                ))}
            </ul>
        </nav>
    );
};

export default Menu;