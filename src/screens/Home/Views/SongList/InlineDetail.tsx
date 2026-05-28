import { useEffect, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetailAll, setListDetail, setListDetailInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { handlePlay } from '@/screens/SonglistDetail/listAction'
import { type ListInfoItem } from '@/store/songlist/state'

export default ({ info }: { info: ListInfoItem }) => {
  const theme = useTheme()
  const listRef = useRef<OnlineListType>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    clearListDetail()
    setListDetailInfo(info.source, info.id)
    const page = 1
    listRef.current?.setStatus('loading')
    getListDetailAll(info.source, info.id, true).then((songs) => {
      const result = setListDetail({ list: songs, total: songs.length, limit: songs.length, source: info.source, page: 1 } as any, info.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus('end')
    }).catch(() => {
      listRef.current?.setStatus('error')
    })
    return () => {
      isUnmountedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.id, info.source])

  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    void handlePlay(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list, index)
  }

  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    getListDetailAll(songlistState.listDetailInfo.source, songlistState.listDetailInfo.id, true).then((songs) => {
      const result = setListDetail({ list: songs, total: songs.length, limit: songs.length, source: songlistState.listDetailInfo.source, page: 1 } as any, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      listRef.current?.setList(result.list)
      listRef.current?.setStatus('end')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length && page == 1) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }

  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    listRef.current?.setStatus('end')
  }

  const handlePlayAll = () => {
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list)
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, borderBottomColor: theme['c-border-background'] }}>
        {info.img ? (
          <Image url={info.img} style={styles.coverImg} />
        ) : null}
        <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.7}>
          <Icon name="play" color={theme['c-font']} size={16} />
          <Text size={14} color={theme['c-font']} style={{ marginLeft: 5 }}>全部播放</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text size={17} color={theme['c-font']} numberOfLines={1} style={styles.title}>
          {info.name}
        </Text>
      </View>
      <OnlineList
        ref={listRef}
        onPlayList={handlePlayList}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
      />
    </View>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  coverImg: {
    width: 42,
    height: 42,
    borderRadius: 6,
    marginRight: 8,
  },
  title: {
    maxWidth: '50%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginRight: 10,
  },
})
