import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import List, { type ListType } from '../Views/Search/List'
import { type Source } from '@/store/search/music/state'

type SearchType = 'music' | 'songlist'

const SEARCH_TYPE_ITEMS: { label: string; id: SearchType }[] = [
  { label: '歌曲', id: 'music' },
  { label: '歌单', id: 'songlist' },
]

export interface InlineSearchType {
  search: (text: string, source?: Source) => void
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  typeBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
    marginTop: 4,
    marginBottom: 4,
  },
})

export default forwardRef<InlineSearchType, {}>((_props, ref) => {
  const listRef = useRef<ListType>(null)
  const theme = useTheme()
  const [searchType, setSearchType] = useState<SearchType>('music')
  const searchTextRef = useRef<string>('')
  const searchSourceRef = useRef<Source>('kw')

  useImperativeHandle(ref, () => ({
    search(text, source = 'kw') {
      searchTextRef.current = text
      searchSourceRef.current = source
      listRef.current?.loadList(text, source, searchType)
    },
  }), [searchType])

  const handleTypeChange = (type: SearchType) => {
    if (type === searchType) return
    setSearchType(type)
    // 切换类型后重新搜索
    if (searchTextRef.current) {
      listRef.current?.loadList(searchTextRef.current, searchSourceRef.current, type)
    }
  }

  const handleSearch = (keyword: string) => {
    searchTextRef.current = keyword
    listRef.current?.loadList(keyword, 'kw', searchType)
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeBar}>
        {SEARCH_TYPE_ITEMS.map(item => (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleTypeChange(item.id)}
            style={{
              paddingLeft: 18,
              paddingRight: 18,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: searchType === item.id ? theme['c-primary-background-active'] || 'rgba(80,130,200,0.25)' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Text
              size={18}
              weight={searchType === item.id ? 'bold' : 'normal'}
              color={searchType === item.id ? theme['c-primary-font-active'] : theme['c-font']}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <List ref={listRef} onSearch={handleSearch} />
    </View>
  )
})
