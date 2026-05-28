import { useEffect, useRef } from 'react'

import { type Source } from '@/store/songlist/state'
import List, { type ListProps, type ListType } from './List'


export default () => {
  const listRef = useRef<ListType>(null)

  useEffect(() => {
    // 监听 Content 发出的音源/标签变更事件，由 Content 驱动加载
    const handleShow = (source: Source, id: string) => {
      listRef.current?.loadTag(source, id)
    }
    global.app_event.on('showSonglistTagList', handleShow)
    return () => {
      global.app_event.off('showSonglistTagList', handleShow)
    }
  }, [])

  const handleTagChange: ListProps['onTagChange'] = (name, id) => {
    // 不关闭抽屉（已改为常驻），直接通知标签变更
    global.app_event.songlistTagInfoChange(name, id)
  }

  return <List ref={listRef} onTagChange={handleTagChange} />
}
