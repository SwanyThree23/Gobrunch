import React from 'react';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="p-6">
            <h1 className="text-4xl font-heading">CY Live</h1>
            <nav className="mt-4 flex gap-4">
                <Link href="/discover"><a className="btn-primary">Discover</a></Link>
                <Link href="/dashboard"><a className="btn-secondary">Command Center</a></Link>
                <Link href="/studio"><a className="btn-secondary">Creator Studio</a></Link>
            </nav>
        </div>
    );
}