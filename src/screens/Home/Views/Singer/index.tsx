import { useEffect, useState, useCallback } from 'react'
import { View, Image, ScrollView, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { getSingerList, type SingerInfo } from '@/core/singer'
import { useTheme } from '@/store/theme/hook'
import Loading from '@/components/common/Loading'
import { setSearchText as setGlobalSearchText, addHistoryWord } from '@/core/search/search'
import IconMaterialIcons from 'react-native-vector-icons/MaterialIcons'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollContent: {
    paddingHorizontal: 3,
    paddingTop: 10,
    paddingBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  singerItem: {
    width: '20%',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    marginBottom: 6,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singerName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default () => {
  const theme = useTheme()
  const [singers, setSingers] = useState<SingerInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSingerList()
      .then(setSingers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSingerPress = useCallback((name: string) => {
    setGlobalSearchText(name)
    void addHistoryWord(name)
    global.app_event.emit('updateSearchText', name)
    global.app_event.emit('inlineSearch', name)
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Loading color={theme['c-font']} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {singers.map((singer, index) => (
          <TouchableOpacity
            key={singer.id || String(index)}
            style={styles.singerItem}
            activeOpacity={0.7}
            onPress={() => handleSingerPress(singer.name)}
          >
            <View style={styles.avatarWrap}>
              {singer.pic ? (
                <Image
                  source={{ uri: singer.pic }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Image source={require('@/resources/images/singer_icon.png')} style={{ width: 96, height: 96, resizeMode: 'contain' }} />
                </View>
              )}
            </View>
            <Text
              style={styles.singerName}
              numberOfLines={1}
              color={theme['c-font']}
            >
              {singer.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}
