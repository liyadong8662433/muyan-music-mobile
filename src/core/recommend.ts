import { getListDetailAll } from '@/core/songlist'

export interface RecommendSong {
  name: string
  singer: string
  img: string
  songmid: string
  source: 'tx'
}

export interface DailyRecommend {
  date: string
  playlistName: string
  playlistCover: string
  song: RecommendSong
  /** 完整原始歌曲数据，用于播放 */
  rawSong: any
  /** 歌单所有歌曲原始数据，用于随机播放 */
  rawSongs: any[]
}

/** 内置固定歌单 ID 列表，始终从所有歌单随机挑选歌曲，可随时增减 */
const BUILTIN_PLAYLIST_IDS = [
  '1831586379',
  '9657218269',
]

let cache: DailyRecommend | null = null

const getTodayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Fisher-Yates 随机打乱
 */
const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 拉取 QQ 音乐每日推荐歌曲
 * 同一个自然日内缓存有效，跨天自动刷新
 */
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
        console.log(`[recommend] 第${i + 1}次请求失败，重试中...`, err.message)
        // 重试前等待递增时间
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 1500))
      }
    }
  }
  throw lastErr
}

export const getDailyRecommend = async (): Promise<DailyRecommend> => {
  const today = getTodayStr()

  if (cache && cache.date === today) {
    return cache
  }

  try {
    // 1. 并行拉取所有内置歌单的全部歌曲（自动分页）
    const results = await Promise.allSettled(
      BUILTIN_PLAYLIST_IDS.map(id =>
        withRetry(() => getListDetailAll('tx', id))
      )
    )

    // 2. 合并所有歌单的歌曲
    const allSongs: any[] = []
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.length) {
        allSongs.push(...result.value)
      }
    })

    if (!allSongs.length) {
      if (cache) return cache
      throw new Error('Failed to fetch any playlist detail')
    }

    // 3. 随机打乱，每次获得不同的推荐顺序
    const shuffled = shuffleArray(allSongs)

    const firstSong = shuffled[0] as any
    const song: RecommendSong = {
      name: firstSong.name || '',
      singer: firstSong.singer || '',
      img: firstSong.img || '',
      songmid: firstSong.songmid || String(firstSong.songId || ''),
      source: 'tx',
    }

    cache = {
      date: today,
      playlistName: '猜你喜欢',
      playlistCover: firstSong.img || '',
      song,
      rawSong: firstSong,
      rawSongs: shuffled,
    }

    return cache
  } catch (err) {
    console.warn('[recommend] fetch failed:', err)
    if (cache) return cache
    throw err
  }
}

/**
 * 清除缓存（强制下次拉取新数据）
 */
export const clearRecommendCache = () => {
  cache = null
}
