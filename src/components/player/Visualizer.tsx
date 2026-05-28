import { useEffect, useRef, useMemo } from 'react'
import { View, Animated, Easing, type ViewStyle } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useIsPlay } from '@/store/player/hook'

const BAR_COUNT = 40
const ANIM_DURATION = 600
const MIN_HEIGHT = 2
const MAX_HEIGHT = 42

const styles = {
  wrapper: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    height: 46,
    gap: 2,
    paddingHorizontal: 2,
  },
  bar: {
    flex: 1,
    maxWidth: 6,
    borderRadius: 1.5,
    minHeight: 2,
  },
}

// 为每根柱子生成随机目标高度
function randomHeight(): number {
  return MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT)
}

export default ({ style }: { style?: ViewStyle }) => {
  const theme = useTheme()
  const isPlay = useIsPlay()

  // 柱子动画值
  const anims = useRef<{ anim: Animated.Value; target: number; delay: number }[]>(
    Array.from({ length: BAR_COUNT }, () => ({
      anim: new Animated.Value(randomHeight()),
      target: randomHeight(),
      delay: Math.random() * 400,
    })),
  ).current

  const animations = useRef<Animated.CompositeAnimation[]>([])
  const barColor = theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'
  const activeColor = theme['c-primary'] || '#1db460'

  // 启动/停止动画
  useEffect(() => {
    // 停止旧动画
    animations.current.forEach(a => a.stop())
    animations.current = []

    if (isPlay) {
      anims.forEach((item) => {
        const nextTarget = item.target
        // 动画到当前目标，再生成新目标继续
        const anim = Animated.sequence([
          Animated.timing(item.anim, {
            toValue: nextTarget,
            duration: ANIM_DURATION + item.delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(item.anim, {
            toValue: randomHeight(),
            duration: ANIM_DURATION,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])

        const loop = Animated.loop(anim)
        loop.start()
        animations.current.push(loop)
      })
    } else {
      // 暂停时全部缩到最小
      anims.forEach((item) => {
        const anim = Animated.timing(item.anim, {
          toValue: MIN_HEIGHT,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        })
        anim.start()
        animations.current.push(anim)
      })
    }

    return () => {
      animations.current.forEach(a => a.stop())
      animations.current = []
    }
  }, [isPlay])

  const bars = useMemo(() => {
    return anims.map((item, i) => (
      <Animated.View
        key={i}
        style={[
          styles.bar,
          {
            height: item.anim,
            backgroundColor: isPlay ? activeColor : barColor,
          },
        ]}
      />
    ))
  }, [isPlay, theme])

  return (
    <View style={[styles.wrapper, style]}>
      {bars}
    </View>
  )
}
