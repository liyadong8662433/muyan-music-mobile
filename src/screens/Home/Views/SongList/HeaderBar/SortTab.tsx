import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'

export interface SortTabProps {
  onSortChange: (id: string) => void
}

export interface SortTabType {
  setSource: (source: Source, activeTab: SortInfo['id']) => void
}


export default forwardRef<SortTabType, SortTabProps>(({ onSortChange }, ref) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setSource(source, activeTab) {
      setSortList(songlistState.sortList[source]!)
      setActiveId(activeTab)
    },
  }))

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handleSortChange = (id: string) => {
    onSortChange(id)
    setActiveId(id)
  }

  return (
    <View style={styles.container}>
      {
        sorts.map(s => (
          <TouchableOpacity
            style={{ ...styles.button, backgroundColor: activeId == s.id ? theme['c-primary-background-active'] : 'rgba(255,255,255,0.12)' }}
            onPress={() => { handleSortChange(s.id) }} key={s.id}
          >
            <Text style={styles.buttonText} color={activeId == s.id ? theme['c-primary-font-active'] : theme['c-font']}>{s.label}</Text>
          </TouchableOpacity>
        ))
      }
    </View>
  )
})


const styles = createStyle({
  container: {
    flexDirection: 'row',
    marginLeft: 0,
  },
  button: {
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginRight: 6,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
})
