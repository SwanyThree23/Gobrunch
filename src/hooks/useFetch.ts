import { useState, useEffect } from 'react';

export function useFetch<T = any>(url: string, options?: RequestInit) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;
        fetch(url, options)
            .then(res => res.json())
            .then(json => {
                if (!cancelled) setData(json);
            })
            .catch(err => {
                if (!cancelled) setError(err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [url]);

    return { data, error, loading };
}
