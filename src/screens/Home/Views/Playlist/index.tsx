import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MusicList from '../Mylist/MusicList'
import { createStyle } from '@/utils/tools'
import { LIST_IDS } from '@/config/constant'
import { setActiveList } from '@/core/list'
import { useActiveListId } from '@/store/list/hook'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
})

export default ({ title }: { title?: string }) => {
  const currentListId = useActiveListId()
  const prevActiveListRef = useRef(currentListId)

  useEffect(() => {
    // 保存进入前的活跃列表
    prevActiveListRef.current = currentListId
    // 使用 requestAnimationFrame 确保在 ActiveList 的 getListPrevSelectId 恢复之后再切换
    const rafId = requestAnimationFrame(() => {
      setActiveList(LIST_IDS.DEFAULT)
    })

    return () => {
      cancelAnimationFrame(rafId)
      // 退出时恢复之前的活跃列表
      if (prevActiveListRef.current && prevActiveListRef.current !== LIST_IDS.DEFAULT) {
        setActiveList(prevActiveListRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.container}>
      <MusicList title={title} />
    </View>
  )
}
