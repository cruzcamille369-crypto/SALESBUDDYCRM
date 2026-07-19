import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useSystem } from './useSystem';
import { getStorageItem } from '../lib/storage';

export function useInfiniteCollection(collectionName: string, filters: Record<string, string> = {}) {
    const { currentUser } = useAuth();
    const { activeServer } = useSystem();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const limit = 50;

    const loadingRef = useRef(false);

    const buildUrl = (offset: number) => {
        const query = new URLSearchParams({
            paginated: 'true',
            limit: String(limit),
            offset: String(offset),
        });
        Object.entries(filters).forEach(([k, v]) => {
            if (v) query.append(k, v);
        });
        return `/api/collections/${collectionName}?${query.toString()}`;
    };

    const filtersString = JSON.stringify(filters);
    const currentUserId = currentUser?.id;
    const currentUserLevel = currentUser?.level;
    const currentUserServerId = currentUser?.serverId;
    const activeServerId = activeServer?.id;

    const fetchPage = useCallback(async (offset: number, replace = false) => {
        if (loadingRef.current || !currentUserId) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const tenantId = activeServerId || getStorageItem('nexus_server_id') || currentUserServerId || 'srv-001';
            const res = await fetch(buildUrl(offset), {
                headers: {
                    'X-Tenant-ID': tenantId,
                    'X-User-Level': String(currentUserLevel || 1),
                    'X-User-ID': String(currentUserId || 'unknown'),
                }
            });
            if (res.ok) {
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error(`Expected JSON response, but received "${contentType}". This usually indicates the API request was redirected or intercepted by the SPA fallback (index.html).`);
                }
                const json = await res.json();
                const items = json.data || [];
                setTotal(json.total || 0);
                setData(prev => replace ? items : [...prev, ...items]);
                setHasMore(items.length >= limit);
            } else {
                const text = await res.text();
                console.warn(`[useInfiniteCollection] Fetch failed with status ${res.status}:`, text.substring(0, 200));
                setHasMore(false);
            }
        } catch (e) {
            console.error('Infinite Fetch Error', e);
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [collectionName, currentUserId, currentUserLevel, currentUserServerId, filtersString, activeServerId]);

    useEffect(() => {
        setHasMore(true);
        fetchPage(0, true);
    }, [fetchPage]);

    const fetchNextPage = useCallback(() => {
        if (hasMore && !loadingRef.current) {
            fetchPage(data.length);
        }
    }, [hasMore, data.length, fetchPage]);

    const refresh = useCallback(() => {
        setHasMore(true);
        fetchPage(0, true);
    }, [fetchPage]);

    return { data, loading, hasMore, fetchNextPage, total, refresh };
}
