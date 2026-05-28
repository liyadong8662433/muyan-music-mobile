import { useEffect, useMemo, useState } from 'react'
import type { InitState as CommonState } from '@/store/common/state'
import Search from '../Views/Search'
import SongList from '../Views/SongList'
import LoveList from '../Views/LoveList'
import Leaderboard from '../Views/Leaderboard'
import Setting from '../Views/Setting'
import Recommend from '../Views/Recommend'
import Singer from '../Views/Singer'
import Daily30 from '../Views/Daily30'
import InlineDetail from '../Views/SongList/InlineDetail'
import Playlist from '../Views/Playlist'
import commonState from '@/store/common/state'

const Main = () => {
  const [id, setId] = useState(commonState.navActiveId)
  const [inlineSonglistInfo, setInlineSonglistInfo] = useState(commonState.inlineSonglistDetail)

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      requestAnimationFrame(() => {
        setId(id)
      })
    }
    const handleInlineDetail = (info: CommonState['inlineSonglistDetail']) => {
      setInlineSonglistInfo(info)
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    global.state_event.on('inlineSonglistDetailUpdated', handleInlineDetail)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
      global.state_event.off('inlineSonglistDetailUpdated', handleInlineDetail)
    }
  }, [])

  const component = useMemo(() => {
    // 歌单详情内嵌显示
    if (inlineSonglistInfo) {
      return <InlineDetail info={inlineSonglistInfo} />
    }

    switch (id) {
      case 'nav_recommend': return <Recommend />
      case 'nav_singer': return <Singer />
      case 'nav_daily30': return <Daily30 />
      case 'nav_songlist': return <SongList />
      case 'nav_top': return <Leaderboard />
      case 'nav_love': return <LoveList />
      case 'nav_playlist': return <Playlist />
      case 'nav_setting': return <Setting />
      case 'nav_search':
      default: return <Search />
    }
  }, [id, inlineSonglistInfo])

  return component
}


export default Main
