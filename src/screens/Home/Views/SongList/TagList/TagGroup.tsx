import { View } from 'react-native'

import Button from '@/components/common/Button'
import { type TagInfoItem } from '@/store/songlist/state'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'

export interface TagGroupProps {
  name: string
  list: TagInfoItem[]
  onTagChange: (name: string, id: string) => void
  activeId: string
}

export default ({ name, list, onTagChange, activeId }: TagGroupProps) => {
  const theme = useTheme()
  return (
    <View>
      {
        name
          ? <Text style={styles.tagTypeTitle} color={theme['c-font-label']}>{name}</Text>
          : null
      }
      <View style={styles.tagTypeList}>
        {list.map(item => {
          const isActive = activeId == item.id
          return (
            <Button
              style={{ ...styles.tagButton, backgroundColor: theme['c-button-background'] }}
              key={item.id}
              onPress={() => { onTagChange(isActive ? '' : item.name, isActive ? '' : item.id) }}
            >
              <Text style={styles.tagButtonText} color={isActive ? theme['c-primary-font-active'] : theme['c-font']}>{item.name}</Text>
            </Button>
          )
        })}
      </View>
    </View>
  )
}

const styles = createStyle({
  tagTypeTitle: {
    marginTop: 10,
    marginBottom: 6,
  },
  tagTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 5,
  },
  tagButtonText: {
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
})
