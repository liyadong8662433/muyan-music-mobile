import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { View, TouchableOpacity, TextInput, Image, Animated } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { setNavActiveId, setInlineSonglistDetail } from '@/core/common'
import { setSearchText as setGlobalSearchText, addHistoryWord } from '@/core/search/search'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import commonState from '@/store/common/state'
import commonActions from '@/store/common/action'

const logoImg = require('@/resources/images/logo_nav.png')
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

const styles = createStyle({
  container: {
    flexGrow: 0,
    paddingBottom: 0,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 10,
  },
  logoColumn: {
    width: '37%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 33,
    height: 46,
    resizeMode: 'contain',
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  searchBox: {
    flex: 1,
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 15,
  },
  navTab: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearBtn: {
    width: 36,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
})

type NavId = 'nav_recommend' | 'nav_songlist' | 'nav_setting'

const NAV_ITEMS: { id: NavId; labelKey: string; icon: string }[] = [
  { id: 'nav_recommend', labelKey: 'nav_recommend', icon: 'leaderboard' },
  { id: 'nav_songlist', labelKey: 'nav_songlist', icon: 'album' },
  { id: 'nav_setting', labelKey: 'nav_setting', icon: 'setting' },
]

const TopNav = memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const statusBarHeight = useStatusbarHeight()
  const activeId = useNavActiveId()
  const [searchText, setLocalSearchText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchSourcePageRef = useRef<string | null>(null)
  const activeIdRef = useRef(activeId)
  useEffect(() => {
    activeIdRef.current = activeId
  })
  const [inlineSonglistInfo, setInlineSonglistInfo] = useState(commonState.inlineSonglistDetail)
  const searchInputRef = useRef<TextInput>(null)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isInitialMount = useRef(true)
  const skipAutoFocusRef = useRef(false)
  // 跟踪进入播放列表前的导航页，用于返回时正确恢复
  const prevNavIdRef = useRef<typeof activeId>(commonState.navActiveId)
  useEffect(() => {
    const handleUpdate = (id: typeof activeId) => {
      if (id !== 'nav_playlist') {
        prevNavIdRef.current = id
      }
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
    }
  }, [])

  const handleBackPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }, [scaleAnim])
  const handleBackPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()
  }, [scaleAnim])
  const handleBack = useCallback(() => {
    // 优先判断：播放列表正在显示（横屏内嵌），返回时只收起播放列表
    if (activeId === 'nav_playlist') {
      setNavActiveId(prevNavIdRef.current || 'nav_recommend')
      return
    }
    // 优先判断：歌单详情正在显示（横屏内嵌）
    if (inlineSonglistInfo) {
      setInlineSonglistDetail(null)
      return
    }
    if (isSearching) {
      if (searchText.trim()) {
        // 在搜索结果页
        if (searchSourcePageRef.current === 'nav_singer' || activeId === 'nav_singer') {
          // 从歌手页搜索，直接退出搜索模式
          global.app_event.emit('clearInlineSearch')
        } else {
          // 其他页面，清除文字，回到热搜/历史页
          setLocalSearchText('')
          global.app_event.emit('inlineSearch', '')
        }
      } else {
        // 在热搜/历史页，退出搜索模式
        global.app_event.emit('clearInlineSearch')
      }
      return
    }
    setNavActiveId('nav_recommend')
  }, [activeId, inlineSonglistInfo, isSearching, searchText])

  // 监听歌单详情内嵌状态
  useEffect(() => {
    const handleInlineDetail = (info: typeof commonState.inlineSonglistDetail) => {
      setInlineSonglistInfo(info)
    }
    global.state_event.on('inlineSonglistDetailUpdated', handleInlineDetail)
    return () => {
      global.state_event.off('inlineSonglistDetailUpdated', handleInlineDetail)
    }
  }, [])

  // 监听搜索状态
  useEffect(() => {
    const handleInlineSearch = (text?: string) => {
      setIsSearching(true)
      // 记录搜索来源页面
      searchSourcePageRef.current = activeIdRef.current
    }
    global.app_event.on('inlineSearch', handleInlineSearch)
    return () => {
      global.app_event.off('inlineSearch', handleInlineSearch)
    }
  }, [])

  // 监听搜索清除
  useEffect(() => {
    const handleClear = () => {
      skipAutoFocusRef.current = true
      setIsSearching(false)
      setLocalSearchText('')
      searchSourcePageRef.current = null
      searchInputRef.current?.blur()
    }
    global.app_event.on('clearInlineSearch', handleClear)
    return () => {
      global.app_event.off('clearInlineSearch', handleClear)
    }
  }, [])

  // 监听搜索文字同步（来自热搜/历史点击）
  useEffect(() => {
    const handleUpdateText = (text: string) => {
      setLocalSearchText(text)
    }
    global.app_event.on('updateSearchText', handleUpdateText)
    return () => {
      global.app_event.off('updateSearchText', handleUpdateText)
    }
  }, [])

  // 文字清空后光标回中（跳过首次挂载，避免 auto-focus 触发 InlineSearch 覆盖主页面）
  useEffect(() => {
    if (skipAutoFocusRef.current) {
      skipAutoFocusRef.current = false
      return
    }
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (!searchText && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.blur()
        requestAnimationFrame(() => {
          searchInputRef.current?.focus()
        })
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [searchText])

  const handleNavPress = useCallback((id: NavId) => {
    setLocalSearchText('')
    global.app_event.emit('clearInlineSearch')
    setNavActiveId(id)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    const text = searchText.trim()
    if (!text) return
    setGlobalSearchText(text)
    void addHistoryWord(text)
    global.app_event.emit('inlineSearch', text, 'all')
  }, [searchText])

  const handleLogoPress = useCallback(() => {
    // 标记跳过光标回中逻辑（防止 blur 后重新 focus 触发 onFocus 重新激活搜索）
    skipAutoFocusRef.current = true
    isInitialMount.current = true
    setLocalSearchText('')
    global.app_event.emit('clearInlineSearch')
    setInlineSonglistDetail(null)
    // 直接通过 store action 设置，跳过 core/common 的 guard（搜索模式下 navActiveId 可能已经是 nav_recommend）
    commonActions.setNavActiveId('nav_recommend')
  }, [])

  const currentNavId = (activeId === 'nav_search' || activeId === 'nav_top' || activeId === 'nav_love' || activeId === 'nav_singer' || activeId === 'nav_daily30')
    ? 'nav_recommend'
    : activeId

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-border-background'], backgroundColor: 'transparent' }}>
      <View style={{ paddingTop: statusBarHeight }} />
      <View style={styles.navContent}>
        {/* LOGO + 搜索框 */}
        <View style={{ ...styles.logoColumn, gap: 12, marginLeft: -40 }}>
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.7}>
            <Image source={logoImg} style={{ width: 56, height: 78, resizeMode: 'contain' }} />
          </TouchableOpacity>
          <View style={{
            width: 360,
            flexDirection: 'row',
            alignItems: 'center',
            height: 54,
            borderRadius: 27,
            borderWidth: 1,
            borderColor: theme['c-border-background'],
            overflow: 'hidden',
          }}>
            <TextInput
              ref={searchInputRef}
              style={{
                flex: 1,
                height: '100%',
                paddingHorizontal: 20,
                fontSize: 19,
                color: theme['c-font'],
                textAlign: 'center',
              }}
              placeholder="聚合搜索"
              placeholderTextColor={theme['c-font-label']}
              value={searchText}
              onChangeText={setLocalSearchText}
              onSubmitEditing={handleSearchSubmit}
              onFocus={() => {
                if (!searchText.trim()) {
                  global.app_event.emit('inlineSearch', '')
                }
              }}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* 右 67%：排行榜返回 / 导航标签 */}
        {((['nav_top', 'nav_playlist', 'nav_love', 'nav_singer', 'nav_daily30'] as string[]).includes(activeId) || (activeId === 'nav_songlist' && inlineSonglistInfo) || isSearching) ? (
          <View style={[styles.rightColumn, { justifyContent: 'space-between' }]}>
            <AnimatedTouchable
              style={[styles.backBtn, {
                transform: [{ scale: scaleAnim }],
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              }]}
              onPress={handleBack}
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
              activeOpacity={1}
            >
              <Icon name="chevron-left" color={theme['c-font']} size={22} />
              <Text size={16} color={theme['c-font']} style={{ marginLeft: 4 }}>返回</Text>
            </AnimatedTouchable>
            {activeId === 'nav_top' ? (
              <Text size={32} bold color={theme['c-font']} style={{ marginRight: 46, marginTop: 50 }}>排行榜</Text>
            ) : activeId === 'nav_playlist' ? (
              <Text size={32} bold color={theme['c-font']} style={{ marginRight: 46, marginTop: 50 }}>播放列表</Text>
            ) : activeId === 'nav_love' ? (
              <Text size={32} bold color={theme['c-font']} style={{ marginRight: 46, marginTop: 50 }}>我的收藏</Text>
            ) : activeId === 'nav_singer' ? (
              <Text size={32} bold color={theme['c-font']} style={{ marginRight: 46, marginTop: 50 }}>歌手</Text>
            ) : activeId === 'nav_daily30' ? (
              <Text size={32} bold color={theme['c-font']} style={{ marginRight: 46, marginTop: 50 }}>每日30首</Text>
            ) : null}
          </View>
        ) : (
        <View style={[styles.rightColumn, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 16 }}>
            {/* 推荐、音乐馆 */}
            {NAV_ITEMS.filter(item => item.id !== 'nav_setting').map(item => {
            const isActive = currentNavId === item.id
            const activeBg = theme.isDark
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(0,0,0,0.09)'
            return (
              <TouchableOpacity
                key={item.id}
                style={{
                  ...styles.navTab,
                  backgroundColor: isActive ? activeBg : 'transparent',
                }}
                onPress={() => handleNavPress(item.id)}
              >
                <Text
                  color={isActive ? theme['c-primary'] : theme['c-font']}
                  size={20}
                  bold
                  style={{ fontWeight: '900' }}
                >
                  {t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            )
          })}
          </View>

          {/* 设置齿轮 */}
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => handleNavPress('nav_setting')}
          >
            <Icon
              name="setting"
              color={currentNavId === 'nav_setting' ? theme['c-primary'] : theme['c-font']}
              size={23}
            />
          </TouchableOpacity>
        </View>
        )}
      </View>
    </View>
  )
})

export default TopNav
