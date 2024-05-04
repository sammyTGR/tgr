import React from 'react';
import { ModeToggle } from '../mode-toggle';

const Navbar: React.FC = () => {
    return (
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
            <ModeToggle />
        </nav>
    );
};

export default Navbar;
