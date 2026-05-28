import music from '@/utils/musicSdk'
import { toNewMusicInfo } from '@/utils'

// 每日30首来源歌单 ID（QQ音乐）
const DAILY30_PLAYLIST_ID = '3795435500'

export interface Daily30Song {
  name: string
  singer: string
  album: string
  img: string
  source: 'tx'
  songmid: string
  duration: number
  [key: string]: any
}

export interface Daily30Data {
  date: string
  songs: Daily30Song[]
}

let cache: Daily30Data | null = null

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 带重试的请求包装
 */
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> => {
  let lastErr: any
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1500))
      }
    }
  }
  throw lastErr
}

/**
 * 随机打乱数组（Fisher-Yates）
 */
const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 拉取每日30首随机推荐
 * 同一个自然日内缓存有效，跨天自动刷新
 */
export const getDaily30 = async (): Promise<Daily30Data> => {
  const today = getTodayStr()

  if (cache && cache.date === today) {
    return cache
  }

  try {
    // 1. 直接拉取指定歌单的所有歌曲
    const detail = await withRetry(() => music.tx?.songList.getListDetail(DAILY30_PLAYLIST_ID))

    if (!detail || !detail.list?.length) {
      if (cache) return cache
      throw new Error('Failed to fetch daily30 playlist')
    }

    const allSongs: any[] = detail.list

    // 2. 去重（按 songmid）+ 随机选 30 首
    const seen = new Set<string>()
    const unique: any[] = []
    for (const s of allSongs) {
      const key = s.songmid || s.songId || s.name
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(s)
      }
    }

    const selected = shuffle(unique).slice(0, 30)

    const songs: Daily30Song[] = selected.map((s: any) => toNewMusicInfo({
      ...s,
      name: s.name || '',
      singer: s.singer || '',
      album: s.album || '',
      img: s.img || selected[0]?.img || '',
      source: 'tx',
      songmid: s.songmid || '',
      duration: s.duration || 0,
      _types: s._types || {},
      types: s.types || {},
    }))

    cache = {
      date: today,
      songs,
    }

    return cache
  } catch (err) {
    console.warn('[daily30] fetch failed:', err)
    if (cache) return cache
    throw err
  }
}

/**
 * 清除缓存（强制下次拉取新数据）
 */
export const clearDaily30Cache = () => {
  cache = null
}
