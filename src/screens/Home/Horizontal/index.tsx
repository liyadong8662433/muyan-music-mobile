import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import TopNav from './TopNav'
import StatusBar from '@/components/common/StatusBar'
import Main from './Main'
import PlayerPanel from './PlayerPanel'
import InlineSearch, { type InlineSearchType } from './InlineSearch'
import InlineDetail from '@/screens/Home/Views/SongList/InlineDetail'
import Playlist from '@/screens/Home/Views/Playlist'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import { type ListInfoItem } from '@/store/songlist/state'
import { type InitState as CommonState } from '@/store/common/state'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  playerPanel: {
    width: '33.33%',
  },
  mainArea: {
    flex: 1,
    overflow: 'hidden',
  },
})

export default () => {
  const theme = useTheme()
  const [searchText, setSearchText] = useState('')
  const [searchActive, setSearchActive] = useState(false)
  const [inlineSonglistInfo, setInlineSonglistInfo] = useState<ListInfoItem | null>(
    commonState.inlineSonglistDetail
  )
  const [navActiveId, setNavActiveId] = useState(commonState.navActiveId)
  const searchRef = useRef<InlineSearchType>(null)

  useEffect(() => {
    const handleNavUpdate = (id: CommonState['navActiveId']) => {
      setNavActiveId(id)
    }
    global.state_event.on('navActiveIdUpdated', handleNavUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavUpdate)
    }
  }, [])

  useEffect(() => {
    const handleInlineDetail = (info: typeof commonState.inlineSonglistDetail) => {
      setInlineSonglistInfo(info)
    }
    global.state_event.on('inlineSonglistDetailUpdated', handleInlineDetail)
    return () => {
      global.state_event.off('inlineSonglistDetailUpdated', handleInlineDetail)
    }
  }, [])

  useEffect(() => {
    const handleInlineSearch = (text: string, source?: string) => {
      setSearchText(text)
      setSearchActive(true)
      setTimeout(() => {
        searchRef.current?.search(text, source)
      }, 50)
    }
    global.app_event.on('inlineSearch', handleInlineSearch)
    return () => {
      global.app_event.off('inlineSearch', handleInlineSearch)
    }
  }, [])

  // 监听搜索清除事件
  useEffect(() => {
    const handleClear = () => {
      setSearchActive(false)
      setSearchText('')
    }
    global.app_event.on('clearInlineSearch', handleClear)
    return () => {
      global.app_event.off('clearInlineSearch', handleClear)
    }
  }, [])

  return (
    <>
      <StatusBar />
      <View style={styles.container}>
        <TopNav />
        <View style={styles.content}>
          {/* 左侧播放器面板 */}
          <View style={{ ...styles.playerPanel, borderRightColor: theme['c-border-background'], backgroundColor: 'transparent', marginTop: 15 }}>
            <PlayerPanel />
          </View>
          {/* 右侧主内容 */}
          <View style={styles.mainArea}>
            {/* Main 始终挂载 */}
            {!searchActive && !inlineSonglistInfo ? <Main /> : null}
            {/* InlineSearch 始终挂载，避免返回时丢失搜索状态 */}
            <View style={{ flex: 1, display: searchActive && !inlineSonglistInfo ? 'flex' : 'none' }}>
              <InlineSearch key="inline-search" ref={searchRef} />
            </View>
            {/* 歌单详情绝对定位覆盖（播放列表显示时隐藏） */}
            {inlineSonglistInfo && navActiveId !== 'nav_playlist' ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <InlineDetail info={inlineSonglistInfo} />
              </View>
            ) : null}
            {/* 播放列表：搜索模式或歌单详情模式下用绝对定位覆盖 */}
            {(searchActive || inlineSonglistInfo) && navActiveId === 'nav_playlist' ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: theme['c-bg'] }}>
                <Playlist />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </>
  )
}
