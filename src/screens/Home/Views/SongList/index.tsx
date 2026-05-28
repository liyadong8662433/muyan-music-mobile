import { View, StyleSheet } from 'react-native'
import Content from './Content'
import TagList from './TagList'

export default () => {
  return (
    <View style={styles.container}>
      <View style={[styles.sidebar, { marginTop: 60 }]}>
        <TagList />
      </View>
      <View style={styles.main}>
        <Content />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 300,
  },
  main: {
    flex: 1,
  },
})
