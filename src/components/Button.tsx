import React from 'react';
import classNames from 'classnames';

export type ButtonVariant = 'primary' | 'secondary' | 'gold';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => {
    const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'bg-gradient-to-r from-burgundy to-burgundy-600 text-white hover:from-burgundy-400 hover:to-burgundy-500 hover:shadow-lg hover:shadow-burgundy/25',
        secondary: 'glass-card text-white hover:bg-white/10 hover:border-gold/30',
        gold: 'bg-gradient-to-r from-gold-400 to-gold-500 text-dark hover:from-gold-300 hover:to-gold-400 hover:shadow-lg hover:shadow-gold/25'
    };
    return <button className={classNames(base, variantClasses[variant], className)} {...props} />;
};