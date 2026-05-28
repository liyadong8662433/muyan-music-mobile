import { memo, useEffect, useState } from 'react'
import { View, AppState } from 'react-native'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import StatusBar from '@/components/common/StatusBar'
// import MoreBtn from './MoreBtn'

import Header from './components/Header'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS, NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import PageContent from '@/components/PageContent'
import commonState, { type InitState as CommonState } from '@/store/common/state'

import Pic from './Pic'
// import ControlBtn from './ControlBtn'
import Lyric from './Lyric'
import PlayInfo from './Player/PlayInfo'
import ControlBtn from './Player/ControlBtn'
import PlaylistBtn from './MoreBtn/PlaylistBtn'
import LoveListBtn from './MoreBtn/LoveListBtn'
import PlayModeBtn from './MoreBtn/PlayModeBtn'
import Visualizer from '@/components/player/Visualizer'
import Playlist from '@/screens/Home/Views/Playlist'
import LoveList from '@/screens/Home/Views/LoveList'
import { createStyle } from '@/utils/tools'
import { marginLeftRaw } from './constant'
import { useStatusbarHeight } from '@/store/common/hook'
// import MoreBtn from './MoreBtn2'

type RightPanel = 'lyric' | 'playlist' | 'lovelist'

export default memo(({ componentId }: { componentId: string }) => {
  const statusBarHeight = useStatusbarHeight()
  const [rightPanel, setRightPanel] = useState<RightPanel>('lyric')

  useEffect(() => {
    const handleTogglePlaylist = () => setRightPanel(prev => prev === 'playlist' ? 'lyric' : 'playlist')
    const handleToggleLoveList = () => setRightPanel(prev => prev === 'lovelist' ? 'lyric' : 'lovelist')
    global.app_event.on('togglePlaylistInDetail', handleTogglePlaylist)
    global.app_event.on('toggleLoveListInDetail', handleToggleLoveList)
    return () => {
      global.app_event.off('togglePlaylistInDetail', handleTogglePlaylist)
      global.app_event.off('toggleLoveListInDetail', handleToggleLoveList)
    }
  }, [])

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
    screenkeepAwake()
    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent>
      <StatusBar />
      <View style={{ ...styles.container, paddingTop: statusBarHeight }}>
        <View style={styles.left}>
          <Header />
          <View style={styles.leftContent}>
            <Pic componentId={componentId} />
            <Visualizer style={{ width: '100%', height: 30, marginTop: 70 }} />
          </View>
          {/* spacer — 控制按钮行间距 */}
          <View style={{ height: 80 }} />
          {/* 底部行：播放模式在左，ControlBtn 居中，播放列表+收藏在右 */}
          <View style={{ marginLeft: marginLeftRaw, marginTop: -40 }}>
            <View style={{ flexDirection: 'row', position: 'absolute', left: '23%', top: 0, bottom: 0, alignItems: 'center', zIndex: 1 }}>
              <PlayModeBtn />
            </View>
            <View nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_player}>
              <ControlBtn />
            </View>
            <View style={{ flexDirection: 'row', position: 'absolute', right: '15%', top: 0, bottom: 0, alignItems: 'center', zIndex: 1 }}>
              <PlaylistBtn />
              <LoveListBtn />
            </View>
          </View>
          <View style={{ marginLeft: marginLeftRaw }}>
            <PlayInfo />
          </View>
        </View>
        <View style={styles.right}>
          {rightPanel === 'playlist' ? (
            <View style={{ flex: 1 }}>
              <Playlist title="播放列表" />
            </View>
          ) : rightPanel === 'lovelist' ? (
            <View style={{ flex: 1 }}>
              <LoveList title="我的收藏" />
            </View>
          ) : <Lyric />}
        </View>
      </View>
    </PageContent>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  left: {
    flex: 1,
    width: '45%',
    paddingBottom: 10,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  leftContent: {
    marginLeft: marginLeftRaw,
    justifyContent: 'flex-start',
    paddingTop: 30,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  right: {
    width: '55%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: '#eee',
  },
})
