/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{ts,tsx,js,jsx}',
        './components/**/*.{ts,tsx,js,jsx}',
        './src/**/*.{ts,tsx,js,jsx}',
        './panels/**/*.html'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#5B0C2D', // deep burgundy
                accent: '#D4AF37', // gold
                cyan: '#00FFFF',
                background: {
                    DEFAULT: '#0a0a0f',
                    navy: '#0c0c24'
                }
            },
            fontFamily: {
                heading: ['"Playfair Display"', 'serif'],
                body: ['"Cormorant Garamond"', 'serif'],
                mono: ['"DM Mono"', 'monospace']
            },
            backgroundImage: {
                'film-grain': "url('/images/film-grain.png')"
            }
        }
    },
    plugins: []
};