import { useState, useEffect } from 'react'
import { View, TouchableOpacity, TextInput } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

const WEATHER_CITY_KEY = '@weather_city'
const DEFAULT_CITY = '呼和浩特'

const WMO_CODES: Record<number, string> = {
  0: '晴',
  1: '大部晴',
  2: '多云',
  3: '阴',
  45: '雾', 48: '雾凇',
  51: '小毛毛雨', 53: '中毛毛雨', 55: '大毛毛雨',
  56: '冻毛毛雨', 57: '冻毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  77: '雪粒',
  80: '阵雨', 81: '中阵雨', 82: '大阵雨',
  85: '小阵雪', 86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴冰雹', 99: '大雷暴伴冰雹',
}

function windDir(deg: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return dirs[Math.round(deg / 45) % 8]
}

const styles = createStyle({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityInput: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 15,
    minWidth: 100,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temp: {
    fontSize: 42,
    lineHeight: 46,
    marginRight: 12,
  },
  condition: {
    fontSize: 18,
  },
  details: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailItem: {
    fontSize: 15,
    opacity: 0.8,
    marginRight: 14,
  },
  forecastRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  forecastDay: {
    alignItems: 'center',
  },
  forecastDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  forecastCondition: {
    fontSize: 14,
    marginVertical: 2,
  },
  forecastHigh: {
    fontSize: 16,
  },
  forecastLow: {
    fontSize: 15,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 15,
    opacity: 0.8,
    textAlign: 'center',
  },
})

interface WeatherData {
  temp: number
  condition: string
  humidity: number
  wind: string
  feelsLike: number
  forecast: { date: string; high: number; low: number; condition: string }[]
}

const fetchWeather = async (city: string): Promise<WeatherData> => {
  // Step 1: geocode city name → lat/lon
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`
  const geoResp = await fetch(geoUrl)
  if (!geoResp.ok) throw new Error('Geocode failed')
  const geo = await geoResp.json()
  const loc = geo.results?.[0]
  if (!loc) throw new Error('City not found')

  // Step 2: fetch weather
  const { latitude, longitude } = loc
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=4&timezone=auto`
  const wResp = await fetch(weatherUrl)
  if (!wResp.ok) throw new Error('Weather fetch failed')
  const data = await wResp.json()

  const cur = data.current ?? {}
  const daily = data.daily ?? {}

  const forecast = (daily.time ?? []).map((t: string, i: number) => ({
    date: t.replace(/^\d{4}-/, ''),
    high: daily.temperature_2m_max?.[i] ?? 0,
    low: daily.temperature_2m_min?.[i] ?? 0,
    condition: WMO_CODES[daily.weather_code?.[i]] ?? '--',
  }))

  return {
    temp: cur.temperature_2m ?? 0,
    condition: WMO_CODES[cur.weather_code] ?? '--',
    humidity: cur.relative_humidity_2m ?? 0,
    wind: `${windDir(cur.wind_direction_10m ?? 0)} ${cur.wind_speed_10m ?? 0}km/h`,
    feelsLike: cur.apparent_temperature ?? 0,
    forecast,
  }
}

export default ({ bgColor: propBgColor }: { bgColor?: string }) => {
  const theme = useTheme()
  const [city, setCity] = useState(DEFAULT_CITY)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [inputCity, setInputCity] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    AsyncStorage.getItem(WEATHER_CITY_KEY).then((saved) => {
      if (saved) setCity(saved)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!city) return
    setLoading(true)
    setError('')
    fetchWeather(city).then((data) => {
      setWeather(data)
      AsyncStorage.setItem(WEATHER_CITY_KEY, city).catch(() => {})
    }).catch(() => {
      setError('获取天气失败')
    }).finally(() => {
      setLoading(false)
    })
  }, [city, retryCount])

  const startEdit = () => {
    setInputCity(city)
    setEditing(true)
  }

  const confirmCity = () => {
    const trimmed = inputCity.trim()
    if (trimmed) {
      setCity(trimmed)
    }
    setEditing(false)
  }

  const hasColorBg = !!propBgColor
  const bgColor = propBgColor || (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
  const textColor = hasColorBg ? '#fff' : theme['c-font']
  const inputBg = hasColorBg ? 'rgba(255,255,255,0.2)' : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
  const borderColor = hasColorBg ? 'rgba(255,255,255,0.2)' : (theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)')

  if (loading && !weather) {
    return (
      <View style={{ ...styles.card, backgroundColor: bgColor }}>
        <Text color={textColor} size={16} style={{ textAlign: 'center' }}>加载天气...</Text>
      </View>
    )
  }

  if (error && !weather) {
    return (
      <View style={{ ...styles.card, backgroundColor: bgColor }}>
        <Text style={styles.errorText} color={textColor}>{error}</Text>
        <TouchableOpacity onPress={() => setRetryCount(c => c + 1)} style={{ marginTop: 8, alignSelf: 'center' }}>
          <Text color={textColor} size={15}>重试</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!weather) return null

  return (
    <View style={{ ...styles.card, backgroundColor: bgColor }}>
      {/* City */}
      <View style={styles.header}>
        <View style={styles.cityRow}>
          {editing ? (
            <View style={styles.cityInputWrap}>
              <TextInput
                style={{ ...styles.cityInput, backgroundColor: inputBg, color: textColor }}
                value={inputCity}
                onChangeText={setInputCity}
                onSubmitEditing={confirmCity}
                autoFocus
                placeholder="输入城市"
                placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'}
              />
              <TouchableOpacity onPress={confirmCity} style={{ marginLeft: 6 }}>
                <Icon name="checkbox-marked" color={textColor} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={startEdit} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="album" color={textColor} size={14} />
              <Text size={18} bold color={textColor} style={{ marginLeft: 4 }}>{city}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current weather */}
      <View style={styles.body}>
        <Text style={styles.temp} bold color={textColor}>{Math.round(weather.temp)}°</Text>
        <View>
          <Text style={styles.condition} color={textColor}>{weather.condition}</Text>
          <View style={styles.details}>
            <Text style={styles.detailItem} color={textColor}>体感 {Math.round(weather.feelsLike)}°</Text>
            <Text style={styles.detailItem} color={textColor}>湿度 {weather.humidity}%</Text>
            <Text style={styles.detailItem} color={textColor} numberOfLines={1}>{weather.wind}</Text>
          </View>
        </View>
      </View>

      {/* 4-day forecast */}
      {weather.forecast.length > 0 && (
        <View style={{ ...styles.forecastRow, borderTopColor: borderColor }}>
          {weather.forecast.map((d, i) => (
            <View key={i} style={styles.forecastDay}>
              <Text style={styles.forecastDate} color={textColor}>{d.date}</Text>
              <Text style={styles.forecastCondition} color={textColor} numberOfLines={1}>{d.condition}</Text>
              <Text style={styles.forecastHigh} bold color={textColor}>{Math.round(d.high)}°</Text>
              <Text style={styles.forecastLow} color={textColor}>{Math.round(d.low)}°</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
