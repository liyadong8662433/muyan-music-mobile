import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { usePlayerMusicInfo, useIsPlay, useStatusText, useProgress } from '@/store/player/hook'
import { playNext, playPrev, togglePlay, collectMusic, uncollectMusic } from '@/core/player/player'
import { MUSIC_TOGGLE_MODE_LIST, MUSIC_TOGGLE_MODE, LIST_IDS } from '@/config/constant'
import { updateSetting, setNavActiveId } from '@/core/common'
import { useLrcPlay } from '@/plugins/lyric'
import { useBufferProgress } from '@/plugins/player'
import { COMPONENT_IDS } from '@/config/constant'
import { usePageVisible } from '@/store/common/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import { Icon } from '@/components/common/Icon'
import Progress from '@/components/player/Progress'
import Visualizer from '@/components/player/Visualizer'
import commonState from '@/store/common/state'
import { type InitState as CommonState } from '@/store/common/state'
import { navigations } from '@/navigation'
import { getListMusics } from '@/core/list'

const FONT_SIZE = 12
const PADDING_TOP_RAW = 1.8
const PADDING_TOP = Math.round(scaleSizeW(PADDING_TOP_RAW))
const MARGIN_TOP = Math.round(scaleSizeH(2))

const styles = createStyle({
  container: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  coverArea: {
    width: 116,
    height: 116,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loveOverlay: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 1,
  },
  lyricArea: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  progressArea: {
    width: '100%',
    height: 22,
    marginBottom: 1,
  },
  progressTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 1,
  },
  controlArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  controlBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnSmall: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default memo(() => {
  const theme = useTheme()
  const isLightTheme = !theme.isDark
  const musicInfo = usePlayerMusicInfo()
  const isPlay = useIsPlay()
  const statusText = useStatusText()
  const t = useI18n()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const allowProgressBarSeek = useSettingValue('common.allowProgressBarSeek')

  // 歌词
  const [autoUpdate, setAutoUpdate] = useState(true)
  const { text: lyricText } = useLrcPlay(autoUpdate)
  const lyricStatus = isPlay ? lyricText : statusText

  // 进度
  const { maxPlayTimeStr, nowPlayTimeStr, progress, maxPlayTime } = useProgress(autoUpdate)
  const buffered = useBufferProgress()

  usePageVisible([COMPONENT_IDS.home], useCallback((visible) => {
    setAutoUpdate(visible)
  }, []))

  // 点击封面进入播放详情
  const handleCoverPress = () => {
    if (!musicInfo.id) return
    navigations.pushPlayDetailScreen(commonState.componentIds.home!)
  }

  // 循环模式
  const playModeIcon = useMemo(() => {
    switch (togglePlayMethod) {
      case MUSIC_TOGGLE_MODE.listLoop: return 'list-loop'
      case MUSIC_TOGGLE_MODE.random: return 'list-random'
      case MUSIC_TOGGLE_MODE.list: return 'list-order'
      case MUSIC_TOGGLE_MODE.singleLoop: return 'single-loop'
      default: return 'single'
    }
  }, [togglePlayMethod])

  const toggleNextPlayMode = () => {
    let index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    if (++index >= MUSIC_TOGGLE_MODE_LIST.length) index = 0
    const mode = MUSIC_TOGGLE_MODE_LIST[index]
    updateSetting({ 'player.togglePlayMethod': mode })
    let modeName: 'play_list_loop' | 'play_list_random' | 'play_list_order' | 'play_single_loop' | 'play_single'
    switch (mode) {
      case MUSIC_TOGGLE_MODE.listLoop: modeName = 'play_list_loop'; break
      case MUSIC_TOGGLE_MODE.random: modeName = 'play_list_random'; break
      case MUSIC_TOGGLE_MODE.list: modeName = 'play_list_order'; break
      case MUSIC_TOGGLE_MODE.singleLoop: modeName = 'play_single_loop'; break
      default: modeName = 'play_single'; break
    }
    toast(t(modeName))
  }

  // 跟踪进入播放列表前的导航页
  const prevNavIdRef = useRef(commonState.navActiveId)
  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      if (id !== 'nav_playlist') {
        prevNavIdRef.current = id
      }
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
    }
  }, [])

  // 播放列表
  const handleShowList = () => {
    if (commonState.navActiveId === 'nav_playlist') {
      setNavActiveId(prevNavIdRef.current)
    } else {
      setNavActiveId('nav_playlist')
    }
  }

  // 收藏状态
  const [isLoved, setIsLoved] = useState(false)

  // 歌曲切换时检查是否已收藏
  useEffect(() => {
    if (!musicInfo.id) {
      setIsLoved(false)
      return
    }
    void getListMusics(LIST_IDS.LOVE).then((musics) => {
      setIsLoved(musics.some(s => s.id == musicInfo.id))
    })
  }, [musicInfo.id])

  // 监听列表变更（收藏/取消收藏后更新状态）
  useEffect(() => {
    const handleUpdate = (ids: string[]) => {
      if (!ids.includes(LIST_IDS.LOVE) || !musicInfo.id) return
      void getListMusics(LIST_IDS.LOVE).then((musics) => {
        setIsLoved(musics.some(s => s.id == musicInfo.id))
      })
    }
    global.app_event.on('myListMusicUpdate', handleUpdate)
    return () => {
      global.app_event.off('myListMusicUpdate', handleUpdate)
    }
  }, [musicInfo.id])

  // 收藏/取消收藏（乐观更新 + 事件校验）
  const handleToggleLove = () => {
    if (!musicInfo.id) return
    if (isLoved) {
      setIsLoved(false)
      void uncollectMusic()
    } else {
      setIsLoved(true)
      void collectMusic()
    }
  }

  const songName = musicInfo.id
    ? musicInfo.singer
      ? `${musicInfo.name} - ${musicInfo.singer}`
      : musicInfo.name
    : '未在播放'

  return (
    <View style={{ ...styles.container, backgroundColor: 'transparent' }}>
      {/* 封面 */}
      <TouchableOpacity onPress={handleCoverPress} activeOpacity={0.8}>
        <View style={styles.coverArea}>
          <Image
            url={musicInfo.pic}
            style={styles.coverImage}
            placeholder={require('@/resources/images/logo_nav.png')}
          />
          {/* 收藏按钮叠在封面右下角 */}
          <TouchableOpacity style={styles.loveOverlay} activeOpacity={0.7} onPress={handleToggleLove}>
            <Text style={{ fontSize: 22, color: isLoved ? theme['c-primary'] : '#fff', lineHeight: 24 }}>
              {isLoved ? '\u2665' : '\u2661'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* 歌曲名称 */}
      <Text style={{ ...styles.songName, color: isLightTheme ? '#000' : theme['c-font'] }} numberOfLines={1}>
        {songName}
      </Text>

      {/* 歌词 */}
      <View style={styles.lyricArea}>
        <Text size={16} color={isLightTheme ? '#000' : theme['c-font-label']} numberOfLines={2}>
          {lyricStatus}
        </Text>
      </View>

      {/* 可视化频谱 */}
      <Visualizer style={{ width: '100%' }} />

      {/* 进度条 */}
      <View style={styles.progressArea}>
        <View style={styles.progressTime}>
          <Text size={FONT_SIZE} color={theme['c-500']}>{nowPlayTimeStr}</Text>
          <Text size={FONT_SIZE} color={theme['c-500']}>{maxPlayTimeStr}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Progress progress={progress} duration={maxPlayTime} buffered={buffered} paddingTop={PADDING_TOP} />
        </View>
      </View>

      {/* 控制按钮 */}
      <View style={styles.controlArea}>
        {/* 循环模式 */}
        <TouchableOpacity style={styles.controlBtnSmall} activeOpacity={0.5} onPress={toggleNextPlayMode}>
          <Icon name={playModeIcon} color={theme['c-button-font']} size={22} />
        </TouchableOpacity>
        {/* 上一曲 */}
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPress={() => void playPrev()}>
          <Icon name='prevMusic' color={theme['c-button-font']} size={30} />
        </TouchableOpacity>
        {/* 播放/暂停 */}
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPress={togglePlay}>
          <Icon name={isPlay ? 'pause' : 'play'} color={theme['c-button-font']} size={40} />
        </TouchableOpacity>
        {/* 下一曲 */}
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.5} onPress={() => void playNext()}>
          <Icon name='nextMusic' color={theme['c-button-font']} size={30} />
        </TouchableOpacity>
        {/* 播放列表 */}
        <TouchableOpacity style={styles.controlBtnSmall} activeOpacity={0.5} onPress={handleShowList}>
          <Icon name='menu' color={theme['c-button-font']} size={22} />
        </TouchableOpacity>
      </View>
    </View>
  )
})
