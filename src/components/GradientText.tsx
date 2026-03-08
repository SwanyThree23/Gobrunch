import React from 'react';

export const GradientText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <span className={`gradient-text ${className || ''}`}>{children}</span>
);
