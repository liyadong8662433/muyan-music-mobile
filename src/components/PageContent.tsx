import { View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import ImageBackground from '@/components/common/ImageBackground'
import { useWindowSize } from '@/utils/hooks'
import { useMemo } from 'react'
import SizeView from './SizeView'

interface Props {
  children: React.ReactNode
}

export default ({ children }: Props) => {
  const theme = useTheme()
  const windowSize = useWindowSize()

  const themeComponent = useMemo(() => (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      {/* 底层：背景图或渐变色图 */}
      <ImageBackground
        style={{ position: 'absolute', left: 0, top: 0, height: windowSize.height, width: windowSize.width }}
        source={theme['bg-image']}
        resizeMode="cover"
      />
      {/* 内容层：半透明背景，透出底层背景 */}
      <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme['c-main-background'] }}>
        {children}
      </View>
    </View>
  ), [children, theme, windowSize.height, windowSize.width])

  return (
    <>
      <SizeView />
      {themeComponent}
    </>
  )
}
