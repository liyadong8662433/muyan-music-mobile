import { useRef, forwardRef, useImperativeHandle } from 'react'
import { type ListInfoItem } from '@/store/songlist/state'
// import LoadingMask, { LoadingMaskType } from '@/components/common/LoadingMask'
import List, { type ListProps, type ListType, type Status } from './List'
import commonState from '@/store/common/state'
import { setInlineSonglistDetail } from '@/core/common'

export interface SonglistProps {
  onRefresh: ListProps['onRefresh']
  onLoadMore: ListProps['onLoadMore']
}
export interface SonglistType {
  setList: (list: ListInfoItem[], showSource?: boolean) => void
  setStatus: (val: Status) => void
}

export default forwardRef<SonglistType, SonglistProps>(({
  onRefresh,
  onLoadMore,
}, ref) => {
  const listRef = useRef<ListType>(null)
  // const loadingMaskRef = useRef<LoadingMaskType>(null)

  useImperativeHandle(ref, () => ({
    setList(list, showSource) {
      listRef.current?.setList(list, showSource)
    },
    setStatus(val) {
      listRef.current?.setStatus(val)
    },
  }))

  const handleOpenDetail = (item: ListInfoItem, index: number) => {
    // 横屏模式：在播放组件右侧内嵌显示
    setInlineSonglistDetail(item)
  }

  return (
    <List
      ref={listRef}
      onRefresh={onRefresh}
      onLoadMore={onLoadMore}
      onOpenDetail={handleOpenDetail}
    />
  )
})
