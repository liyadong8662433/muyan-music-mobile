import { memo, useEffect, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
// import { useLayout } from '@/utils/hooks'
import { usePlayerMusicInfo } from '@/store/player/hook'
import { useWindowSize } from '@/utils/hooks'
import { useNavigationComponentDidAppear } from '@/navigation'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { createStyle } from '@/utils/tools'
import { HEADER_HEIGHT } from './components/Header'
import { BTN_WIDTH } from './MoreBtn/Btn'
import { marginLeft } from './constant'
import Image from '@/components/common/Image'
import Text from '@/components/common/Text'
import { collectMusic, uncollectMusic } from '@/core/player/player'
import { getListMusics } from '@/core/list'
import { LIST_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import { useStatusbarHeight } from '@/store/common/hook'
import commonState from '@/store/common/state'


export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()
  const theme = useTheme()
  const { width: winWidth, height: winHeight } = useWindowSize()
  const statusBarHeight = useStatusbarHeight()

  const [animated, setAnimated] = useState(!!commonState.componentIds.playDetail)
  const [pic, setPic] = useState(musicInfo.pic)
  useEffect(() => {
    if (animated) setPic(musicInfo.pic)
  }, [musicInfo.pic, animated])

  useNavigationComponentDidAppear(componentId, () => {
    setAnimated(true)
  })

  // 收藏状态
  const [isLoved, setIsLoved] = useState(false)
  useEffect(() => {
    if (!musicInfo.id) {
      setIsLoved(false)
      return
    }
    void getListMusics(LIST_IDS.LOVE).then((musics) => {
      setIsLoved(musics.some(s => s.id == musicInfo.id))
    })
  }, [musicInfo.id])
  useEffect(() => {
    const handleUpdate = () => {
      if (!musicInfo.id) return
      void getListMusics(LIST_IDS.LOVE).then((musics) => {
        setIsLoved(musics.some(s => s.id == musicInfo.id))
      })
    }
    global.app_event.on('myListMusicUpdate', handleUpdate)
    return () => {
      global.app_event.off('myListMusicUpdate', handleUpdate)
    }
  }, [musicInfo.id])
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

  let imgWidth = Math.min((winWidth * 0.45 - marginLeft - BTN_WIDTH) * 0.45, (winHeight - statusBarHeight - HEADER_HEIGHT) * 0.38)
  imgWidth -= imgWidth * (global.lx.fontSize - 1) * 0.3
  let contentHeight = imgWidth

  return (
    <View style={{ ...styles.container, height: contentHeight }}>
      <View style={{ ...styles.content, elevation: animated ? 3 : 0 }}>
        <Image url={pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={{
          width: imgWidth,
          height: imgWidth,
          borderRadius: 2,
        }} />
        {/* 收藏按钮叠在封面右下角 */}
        <TouchableOpacity style={styles.loveOverlay} activeOpacity={0.7} onPress={handleToggleLove}>
          <Text style={{ fontSize: 22, color: isLoved ? theme['c-primary'] : '#fff', lineHeight: 24 }}>
            {isLoved ? '\u2665' : '\u2661'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexShrink: 1,
    flexGrow: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  content: {
    // elevation: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    borderRadius: 4,
    marginBottom: 0,
  },
  loveOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
  },
})
