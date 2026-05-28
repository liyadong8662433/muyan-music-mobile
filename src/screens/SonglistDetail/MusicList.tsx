import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import OnlineList, { type OnlineListType, type OnlineListProps } from '@/components/OnlineList'
import { clearListDetail, getListDetailAll, getListDetailPage, setListDetail, setListDetailInfo } from '@/core/songlist'
import songlistState from '@/store/songlist/state'
import { handlePlay } from './listAction'
import Header, { type HeaderType } from './Header'
import { useListInfo } from './state'

export interface MusicListProps {
  componentId: string
}

export interface MusicListType {
  loadList: (source: LX.OnlineSource, listId: string) => void
}

export default forwardRef<MusicListType, MusicListProps>(({ componentId }, ref) => {
  const listRef = useRef<OnlineListType>(null)
  const headerRef = useRef<HeaderType>(null)
  const isUnmountedRef = useRef(false)
  const info = useListInfo()
  const currentPageRef = useRef(1)
  const totalRef = useRef(0)
  const isLoadingMoreRef = useRef(false)
  const loadAllResolveRef = useRef<((list: LX.Music.MusicInfoOnline[]) => void) | null>(null)

  useImperativeHandle(ref, () => ({
    async loadList(source, id) {
      clearListDetail()
      const listDetailInfo = songlistState.listDetailInfo
      listRef.current?.setList([])
      currentPageRef.current = 1
      totalRef.current = 0

      if (listDetailInfo.id == id && listDetailInfo.source == source && listDetailInfo.list.length) {
        requestAnimationFrame(() => {
          listRef.current?.setList(listDetailInfo.list)
          headerRef.current?.setInfo({
            name: (info.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info.desc || '',
            playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info.img ?? listDetailInfo.info.img,
          })
        })
        return
      }

      // 只加载第一页，页面秒开
      listRef.current?.setStatus('loading')
      const page = 1
      setListDetailInfo(info.source, info.id)
      headerRef.current?.setInfo({
        name: (info.name || listDetailInfo.info.name) ?? '',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        desc: listDetailInfo.info.desc || info.desc || '',
        playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
        imgUrl: info.img ?? listDetailInfo.info.img,
      })

      return getListDetailPage(source, id, page, true).then((result) => {
        if (isUnmountedRef.current) return
        totalRef.current = result.total
        currentPageRef.current = page
        const detailResult = setListDetail({ list: result.list, total: result.total, limit: result.limit, source, page } as any, id, page)
        requestAnimationFrame(() => {
          headerRef.current?.setInfo({
            name: (info.name || listDetailInfo.info.name) ?? '',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            desc: listDetailInfo.info.desc || info.desc || '',
            playCount: (info.play_count ?? listDetailInfo.info.play_count) ?? '',
            imgUrl: info.img ?? listDetailInfo.info.img,
          })
          // 判断是否还有更多
          const hasMore = detailResult.list.length < totalRef.current
          listRef.current?.setList(detailResult.list, false, false)
          listRef.current?.setStatus(hasMore ? 'idle' : 'end')
        })
      }).catch(() => {
        if (songlistState.listDetailInfo.list.length) clearListDetail()
        listRef.current?.setStatus('error')
      })
    },
  }))

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])


  const handlePlayList: OnlineListProps['onPlayList'] = (index) => {
    const listDetailInfo = songlistState.listDetailInfo
    // 播放时如果列表还没加载完，后台加载全部
    if (listDetailInfo.list.length < totalRef.current) {
      // 触发后台加载全部
      getListDetailAll(listDetailInfo.source, listDetailInfo.id, false).then((songs) => {
        if (!isUnmountedRef.current) {
          setListDetail({ list: songs, total: songs.length, limit: songs.length, source: listDetailInfo.source, page: 1 } as any, listDetailInfo.id, 1)
          handlePlay(listDetailInfo.id, listDetailInfo.source, songs, index)
        }
      })
    } else {
      handlePlay(listDetailInfo.id, listDetailInfo.source, listDetailInfo.list, index)
    }
  }
  const handleRefresh: OnlineListProps['onRefresh'] = () => {
    const page = 1
    listRef.current?.setStatus('refreshing')
    totalRef.current = 0
    currentPageRef.current = 1
    getListDetailAll(songlistState.listDetailInfo.source, songlistState.listDetailInfo.id, true).then((songs) => {
      const result = setListDetail({ list: songs, total: songs.length, limit: songs.length, source: songlistState.listDetailInfo.source, page: 1 } as any, songlistState.listDetailInfo.id, page)
      if (isUnmountedRef.current) return
      totalRef.current = songs.length
      listRef.current?.setList(result.list, false, false)
      listRef.current?.setStatus('end')
    }).catch(() => {
      if (songlistState.listDetailInfo.list.length) clearListDetail()
      listRef.current?.setStatus('error')
    })
  }
  const handleLoadMore: OnlineListProps['onLoadMore'] = () => {
    // 防止重复加载
    if (isLoadingMoreRef.current) return
    const nextPage = currentPageRef.current + 1
    const maxPage = Math.ceil(totalRef.current / 30)
    if (nextPage > maxPage) {
      listRef.current?.setStatus('end')
      return
    }
    isLoadingMoreRef.current = true
    listRef.current?.setStatus('loading')
    getListDetailPage(songlistState.listDetailInfo.source, songlistState.listDetailInfo.id, nextPage, false).then((result) => {
      if (isUnmountedRef.current) return
      currentPageRef.current = nextPage
      const currentList = songlistState.listDetailInfo.list
      const newList = [...currentList, ...result.list]
      const detailResult = setListDetail({ list: newList, total: result.total, limit: result.limit, source: result.source, page: nextPage } as any, songlistState.listDetailInfo.id, nextPage)
      const hasMore = newList.length < totalRef.current
      listRef.current?.setList(result.list, true, false) // 追加新数据
      listRef.current?.setStatus(hasMore ? 'idle' : 'end')
    }).catch(() => {
      listRef.current?.setStatus('error')
    }).finally(() => {
      isLoadingMoreRef.current = false
    })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const header = useMemo(() => <Header ref={headerRef} componentId={componentId} />, [])

  return <OnlineList
    ref={listRef}
    onPlayList={handlePlayList}
    onRefresh={handleRefresh}
    onLoadMore={handleLoadMore}
    ListHeaderComponent={header}
    // progressViewOffset={}
   />
})

