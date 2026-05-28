import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import PlaylistBtn from './PlaylistBtn'
import LoveListBtn from './LoveListBtn'

export default () => {
  return (
    <View style={styles.container}>
      <PlaylistBtn />
      <LoveListBtn />
      <PlayModeBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: 'column',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    position: 'absolute',
    height: '100%',
    left: 0,
    top: 80,
    gap: 16,
    zIndex: 1,
  },
})
