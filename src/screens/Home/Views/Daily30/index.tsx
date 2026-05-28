import { useEffect, useState, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { getDaily30, type Daily30Song } from '@/core/daily30'
import { overwriteListMusics } from '@/core/list'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { useTheme } from '@/store/theme/hook'
import Loading from '@/components/common/Loading'

const styles = createStyle({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  playAllText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 24,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  songItem: {
    width: '50%',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  songCard: {
    borderRadius: 8,
    height: 68,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  songName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    opacity: 0.85,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const Daily30 = () => {
  const theme = useTheme()
  const [songs, setSongs] = useState<Daily30Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDaily30()
      .then(data => setSongs(data.songs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlayAll = useCallback(async () => {
    if (!songs.length) return
    await overwriteListMusics(LIST_IDS.DEFAULT, [...songs])
    void playList(LIST_IDS.DEFAULT, 0)
  }, [songs])

  const handleSongPress = useCallback(async (index: number) => {
    if (!songs.length) return
    await overwriteListMusics(LIST_IDS.DEFAULT, [...songs])
    void playList(LIST_IDS.DEFAULT, index)
  }, [songs])

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Loading color={theme['c-font']} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={{ ...styles.playAllBtn, backgroundColor: theme['c-button-background'] }}
            activeOpacity={0.7}
            onPress={handlePlayAll}
          >
            <Text style={{ fontSize: 22, color: theme['c-button-font'] }}>▶</Text>
            <Text style={{ ...styles.playAllText as any, color: theme['c-button-font'] }}>播放全部</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridWrap}>
          {songs.map((song, index) => (
            <View key={song.songmid || String(index)} style={styles.songItem}>
              <TouchableOpacity
                style={{ ...styles.songCard, backgroundColor: theme['c-content-background'] }}
                activeOpacity={0.7}
                onPress={() => handleSongPress(index)}
              >
                <Text style={{ ...styles.songName as any, color: theme['c-font'] }} numberOfLines={1}>{song.name}</Text>
                <Text style={{ ...styles.artistName as any, color: theme['c-font'] }} numberOfLines={1}>{song.singer}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default Daily30
