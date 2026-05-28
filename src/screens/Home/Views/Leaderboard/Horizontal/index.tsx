import { useEffect, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'

import LeftBar, { type LeftBarType, type LeftBarProps } from './LeftBar'
import MusicList, { type MusicListType } from '../MusicList'
import { getLeaderboardSetting, saveLeaderboardSetting } from '@/utils/data'
import boardState from '@/store/leaderboard/state'
import { handlePlay } from '../listAction'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'


export default () => {
  const leftBarRef = useRef<LeftBarType>(null)
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const theme = useTheme()

  const handleChangeBound: LeftBarProps['onChangeList'] = (source, id) => {
    musicListRef.current?.loadList(source, id)
    void saveLeaderboardSetting({
      source,
      boardId: id,
    })
  }

  const handlePlayAll = () => {
    const { id, list } = boardState.listDetailInfo
    if (!id || !list?.length) return
    // 切换到列表顺序播放
    updateSetting({ 'player.togglePlayMethod': 'list' })
    void handlePlay(id, list, 0)
  }

  useEffect(() => {
    isUnmountedRef.current = false
    void getLeaderboardSetting().then(({ source, boardId }) => {
      leftBarRef.current?.setBound(source, boardId)
      musicListRef.current?.loadList(source, boardId)
    })

    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  return (
    <View style={styles.container}>
      <LeftBar
        ref={leftBarRef}
        onChangeList={handleChangeBound}
      />
      <View style={styles.content}>
        <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.7}>
          <Icon name="play" color={theme['c-font']} size={14} />
          <Text size={13} color={theme['c-font']} style={{ marginLeft: 6 }}>全部播放</Text>
        </TouchableOpacity>
        <MusicList
          ref={musicListRef}
        />
      </View>
    </View>
  )
}

const styles = createStyle({
  container: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 10,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
})
