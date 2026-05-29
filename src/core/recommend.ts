import { getListDetailAll } from '@/core/songlist'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
  '9719465952',
  '9657218269',
]

const STORAGE_KEY = '@recommend_cache'

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

/**
 * 保存缓存到 AsyncStorage（持久化兜底）
 */
const saveCacheToStorage = async (data: DailyRecommend) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

/**
 * 从 AsyncStorage 加载上次成功的缓存
 */
const loadCacheFromStorage = async (): Promise<DailyRecommend | null> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY)
    if (json) {
      const data = JSON.parse(json) as DailyRecommend
      if (data.rawSongs?.length) return data
    }
  } catch {}
  return null
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

    // 2. 合并所有歌单的歌曲，按 id (tx_songmid) 去重（toNewMusicInfo 后 songmid 在 id 和 meta.songId）
    const seen = new Set<string>()
    const allSongs: any[] = []
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value?.length) {
        for (const song of result.value) {
          const key = song.id || song.meta?.songId || song.songmid || String(song.songId || '')
          if (key && !seen.has(key)) {
            seen.add(key)
            allSongs.push(song)
          }
        }
      }
    })
    console.log('[recommend] allSongs final length:', allSongs.length, 'seen size:', seen.size)

    if (!allSongs.length) {
      // 网络失败：优先内存缓存，其次 AsyncStorage 兜底
      if (cache) return cache
      const stored = await loadCacheFromStorage()
      if (stored) {
        console.log('[recommend] API 全部失败，使用本地缓存')
        cache = stored
        return stored
      }
      throw new Error('Failed to fetch any playlist detail')
    }

    // 3. 随机打乱，每次获得不同的推荐顺序
    const shuffled = shuffleArray(allSongs)

    // 找到第一首有有效封面的歌
    const firstValidSong = shuffled.find((s: any) => {
      const pic = s.meta?.picUrl || s.img
      return pic && !pic.includes('M000.')
    }) || shuffled[0]
    const firstSong = firstValidSong as any

    const coverPic = (firstSong.meta?.picUrl || firstSong.img || '') as string
    // 过滤掉无效 URL（例如缺少 mid 导致 M000.jpg 的 404 链接）
    const validPic = coverPic && !coverPic.includes('M000.') ? coverPic : ''
    const mid = firstSong.id?.replace('tx_', '') || firstSong.meta?.songId || ''

    const song: RecommendSong = {
      name: firstSong.name || '',
      singer: firstSong.singer || '',
      img: validPic,
      songmid: mid,
      source: 'tx',
    }

    // playlistCover 也用第一首歌的封面
    const playlistCover = validPic

    cache = {
      date: today,
      playlistName: '猜你喜欢',
      playlistCover,
      song,
      rawSong: firstSong,
      rawSongs: shuffled,
    }

    // 成功拉取后持久化到 AsyncStorage
    saveCacheToStorage(cache)

    return cache
  } catch (err) {
    console.warn('[recommend] fetch failed:', err)
    if (cache) return cache
    // 最后兜底：尝试加载 AsyncStorage 缓存
    const stored = await loadCacheFromStorage()
    if (stored) {
      console.log('[recommend] 加载本地缓存作为兜底')
      cache = stored
      return stored
    }
    throw err
  }
}

/**
 * 清除缓存（强制下次拉取新数据）
 */
export const clearRecommendCache = () => {
  cache = null
}
