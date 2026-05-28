import { useEffect, useState, useCallback } from 'react'
import { View, TouchableOpacity, Image, ScrollView } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { setNavActiveId } from '@/core/common'
import { getDailyRecommend, type DailyRecommend } from '@/core/recommend'
import { LIST_IDS } from '@/config/constant'
import { overwriteListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { usePlayerMusicInfo, usePlayMusicInfo, usePlayInfo } from '@/store/player/hook'
import { getList } from '@/core/player/playInfo'
import { useTheme } from '@/store/theme/hook'
import Weather from '@/components/Weather'


const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  leftPanel: {
    flex: 1,
  },
  rightPanel: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  // 猜你喜欢 - 紧凑卡片
  forYouCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  forYouContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  forYouCover: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  forYouCoverPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forYouInfo: {
    flex: 1,
    marginLeft: 2,
  },
  forYouLabel: {
    fontSize: 16,
    marginBottom: 2,
    opacity: 0.8,
  },
  forYouSongName: {
    fontSize: 22,
    marginBottom: 1,
  },
  forYouArtist: {
    fontSize: 14,
    opacity: 0.7,
  },
  forYouPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // 右侧小卡片
  smallCard: {
    width: '47%',
    aspectRatio: 1.1,
    borderRadius: 14,
    padding: 14,
    overflow: 'hidden',
  },
  smallCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardTextWrap: {
    marginTop: 'auto',
  },
  smallCardTitle: {
    fontSize: 20,
    marginBottom: 2,
  },
  smallCardSub: {
    fontSize: 15,
    opacity: 0.7,
  },
})

// 各卡片配色
const CARD_COLORS = {
  forYou: '#1db460',
  daily30: '#5b6abf',
  leaderboard: '#f5a623',
  million: '#4a90d9',
  singer: '#9b59b6',
  weather: '#20b2aa',
}
// 白色主题卡片配色
const WHITE_CARD_COLORS = {
  forYou: '#e8817a',
  daily30: '#7b8cd6',
  leaderboard: '#f0b050',
  million: '#6ba3d6',
  singer: '#b87dc4',
  weather: '#7ec8c8',
}
// 黑色主题卡片配色
const BLACK_CARD_COLORS = {
  forYou: '#c0392b',
  daily30: '#7f5fcf',
  leaderboard: '#d48a20',
  million: '#2980b9',
  singer: '#8e44ad',
  weather: '#0d7377',
}

type CardData = {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
}

const CARDS: CardData[] = [
  { id: 'daily30', title: '每日30首', subtitle: '每日更新推荐', icon: 'music_time', color: CARD_COLORS.daily30 },
  { id: 'leaderboard', title: '排行榜', subtitle: '热门榜单排行', icon: 'leaderboard', color: CARD_COLORS.leaderboard },
  { id: 'million', title: '我的收藏', subtitle: '已收藏歌曲', icon: 'love', color: CARD_COLORS.million },
  { id: 'singer', title: '歌手', subtitle: '热门歌手推荐', icon: 'single', color: CARD_COLORS.singer },
]

export default () => {
  const theme = useTheme()
  const cardColors = theme.isDark ? BLACK_CARD_COLORS : WHITE_CARD_COLORS
  const [recommend, setRecommend] = useState<DailyRecommend | null>(null)
  const musicInfo = usePlayerMusicInfo()
  const playMusicInfo = usePlayMusicInfo()
  const playInfo = usePlayInfo()

  useEffect(() => {
    getDailyRecommend().then(setRecommend).catch(() => {})
  }, [])

  // 猜你喜欢模式：当前播放列表是 TEMP 且正在播放
  const isInForYouMode = playMusicInfo.listId === LIST_IDS.TEMP && !!musicInfo.id

  const handleCardPress = useCallback((cardId: string) => {
    switch (cardId) {
      case 'leaderboard':
        setNavActiveId('nav_top')
        break
      case 'million':
        setNavActiveId('nav_love')
        break
      case 'singer':
        setNavActiveId('nav_singer')
        break
      case 'daily30':
        setNavActiveId('nav_daily30')
        break
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!recommend?.rawSongs?.length) return
    if (isInForYouMode) {
      // 已在猜你喜欢模式：播放卡片上显示的下一首歌
      const nextIndex = (playInfo.playerPlayIndex + 1) % recommend.rawSongs.length
      void playList(LIST_IDS.TEMP, nextIndex)
    } else {
      // 首次点击：将所有推荐歌曲放入 TEMP 列表，从第一首开始播放
      // rawSongs 来自 getListDetailAll，已经过 toNewMusicInfo 转换，无需再次转换
      const musicInfos = recommend.rawSongs as any[]
      void overwriteListMusics(LIST_IDS.TEMP, musicInfos).then(() => {
        void playList(LIST_IDS.TEMP, 0)
      })
    }
  }, [recommend, isInForYouMode, playInfo.playerPlayIndex])

  // 计算下一首要播放的歌曲（进入猜你喜欢模式后显示）
  const getNextSong = () => {
    if (!isInForYouMode) return null
    const tempList = getList(LIST_IDS.TEMP) as any[]
    if (!tempList.length) return null
    const nextIndex = (playInfo.playerPlayIndex + 1) % tempList.length
    return tempList[nextIndex] || null
  }
  const nextSong = getNextSong()

  const coverImg = isInForYouMode && nextSong
    ? (nextSong.pic || nextSong.img || nextSong.meta?.picUrl || '')
    : (recommend?.song.img || recommend?.playlistCover)
  const songName = isInForYouMode
    ? (nextSong?.name || musicInfo.name || '')
    : (recommend?.song.name || '加载中...')
  const artistName = isInForYouMode
    ? (nextSong?.singer || musicInfo.singer || '')
    : (recommend?.song.singer || '')
  const labelText = isInForYouMode ? '下一首' : '猜你喜欢'

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        {/* 左侧：猜你喜欢 + 天气 */}
        <View style={styles.leftPanel}>
          <View style={{ ...styles.forYouCard, backgroundColor: cardColors.forYou }}>
            <View style={styles.forYouContent}>
              {coverImg ? (
                <Image source={{ uri: coverImg }} style={styles.forYouCover} />
              ) : (
                <View style={{ ...styles.forYouCoverPlaceholder, backgroundColor: 'rgba(255,255,255,0.25)' }}>
                  <Icon name="love" color="#fff" size={30} />
                </View>
              )}
              <View style={styles.forYouInfo}>
                <Text style={styles.forYouLabel} color="#fff">{labelText}</Text>
                <Text style={styles.forYouSongName} color="#fff" numberOfLines={1} bold>
                  {songName}
                </Text>
                <Text style={styles.forYouArtist} color="#fff" numberOfLines={1}>
                  {artistName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ ...styles.forYouPlayBtn, backgroundColor: 'rgba(255,255,255,0.3)' }}
              onPress={handlePlay}
              activeOpacity={0.7}
            >
              <Icon name="play" color="#fff" size={22} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginTop: 8 }}>
            <Weather bgColor={cardColors.weather} />
          </View>
        </View>

        {/* 右侧：4个小卡片 */}
        <View style={styles.rightPanel}>
          {CARDS.map(card => (
            <TouchableOpacity
              key={card.id}
              style={{ ...styles.smallCard, backgroundColor: cardColors[card.id as keyof typeof cardColors] }}
              onPress={() => handleCardPress(card.id)}
              activeOpacity={0.75}
            >
              <View style={{ ...styles.smallCardIconWrap, backgroundColor: 'rgba(255,255,255,0.25)' }}>
                {card.id === 'singer' ? (
                  <Image source={require('@/resources/images/singer_icon.png')} style={{ width: 66, height: 66, resizeMode: 'contain' }} />
                ) : (
                  <Icon name={card.icon} color="#fff" size={30} />
                )}
              </View>
              <View style={styles.smallCardTextWrap}>
                <Text style={styles.smallCardTitle} color="#fff" bold>{card.title}</Text>
                <Text style={styles.smallCardSub} color="#fff">{card.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
