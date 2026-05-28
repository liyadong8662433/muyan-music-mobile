import { useMemo, useState, useEffect } from 'react'
import { View, ScrollView, Alert } from 'react-native'
import { Navigation } from 'react-native-navigation'

import Button from '@/components/common/Button'
import { createStyle, openUrl } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import ModalContent from './ModalContent'
import { exitApp } from '@/utils/nativeModules/utils'
import { updateSetting } from '@/core/common'
import { checkUpdate } from '@/core/version'
import { initDeeplink } from '@/core/init/deeplink'
import settingState from '@/store/setting/state'

const Content = () => {
  const theme = useTheme()

  const openSourcePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile')
  }
  const openLicensePage = () => {
    void openUrl('http://www.apache.org/licenses/LICENSE-2.0')
  }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
  } as const

  return (
    <View style={styles.main}>
      <Text style={styles.title} size={18} >许可协议</Text>
      <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
        {!settingState.setting['common.isAgreePact'] && <Text selectable style={styles.bold} >在使用本软件前，你（使用者）需签署本协议才可继续使用！{'\n'}</Text>}
        <Text selectable style={styles.text} >本软件「沐沐MUSIC」是基于开源项目 <Text onPress={openSourcePage} style={textLinkStyle}>LX Music（洛雪音乐）</Text> 进行修改定制的<Text style={styles.bold}>第三方修改版</Text>，本项目基于 <Text onPress={openLicensePage} style={textLinkStyle}>Apache License 2.0</Text> 许可证发行。以下协议是对 Apache License 2.0 的补充，如有冲突，以以下协议为准。{'\n'}</Text>
        <Text selectable style={styles.bold} >一、项目说明{'\n'}</Text>
        <Text selectable style={styles.text} >1.1 本软件是在 LX Music 开源代码基础上进行的个性化修改版本，与 LX Music 原作者无任何关联，原作者不对本修改版承担任何责任。{'\n'}</Text>
        <Text selectable style={styles.text} >1.2 本软件仅供个人学习、研究和技术交流使用，不得用于任何商业用途。{'\n'}</Text>
        <Text selectable style={styles.text} >1.3 本软件按"原样"提供，不提供任何明示或暗示的担保，包括但不限于对适销性、特定用途适用性的担保。{'\n'}</Text>
        <Text selectable style={styles.bold} >二、数据来源{'\n'}</Text>
        <Text selectable style={styles.text} >2.1 本软件的数据获取原理是从各官方音乐平台的公开服务器中拉取数据（与未登录状态在官方平台 APP 获取的数据相同），经过简单筛选与合并后进行展示。本软件<Text style={styles.bold}>不对数据的准确性、完整性、合法性承担任何责任</Text>。{'\n'}</Text>
        <Text selectable style={styles.text} >2.2 本软件本身没有获取某个音频数据的能力，本软件使用的在线音频数据来源来自软件设置内"自定义源"设置所选择的"源"返回的在线链接。本软件无法校验"源"返回数据的准确性与合法性，使用本软件过程中可能会出现希望播放的音频与实际播放的音频不对应或者无法播放的问题。{'\n'}</Text>
        <Text selectable style={styles.text} >2.3 本软件的非官方平台数据（例如"我的列表"内列表）来自使用者本地系统或者使用者连接的同步服务，本软件不对这些数据的合法性、准确性负责。{'\n'}</Text>
        <Text selectable style={styles.bold} >三、版权声明{'\n'}</Text>
        <Text selectable style={styles.text} >3.1 本软件尊重并保护所有版权所有者的合法权益。使用本软件的过程中可能会产生版权数据，对于这些版权数据，本软件<Text style={styles.bold}>不拥有它们的所有权</Text>。{'\n'}</Text>
        <Text selectable style={styles.text} >3.2 为了避免侵权，使用者务必在 <Text style={styles.bold}>24 小时内</Text> 清除使用本软件的过程中所产生的版权数据。{'\n'}</Text>
        <Text selectable style={styles.text} >3.3 本软件内使用的部分包括但不限于字体、图片、图标等资源来源于互联网。如果出现侵权，可联系本软件开发者移除。{'\n'}</Text>
        <Text selectable style={styles.text} >3.4 <Text style={styles.bold}>音乐平台不易，请尊重版权，支持正版。</Text>{'\n'}</Text>
        <Text selectable style={styles.bold} >四、音乐平台别名{'\n'}</Text>
        <Text selectable style={styles.text} >4.1 本软件内的官方音乐平台别名为本软件内对官方音乐平台的一个称呼，不包含恶意。如果官方音乐平台觉得不妥，可联系本软件开发者更改或移除。{'\n'}</Text>
        <Text selectable style={styles.bold} >五、免责声明{'\n'}</Text>
        <Text selectable style={styles.text} >5.1 <Text style={styles.bold}>本软件开发者不对因使用本软件而产生的任何直接、间接、特殊、偶然或结果性损害承担责任</Text>，包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失。{'\n'}</Text>
        <Text selectable style={styles.text} >5.2 本软件开发者不对本软件的可用性、可靠性、准确性做任何保证，本软件可能包含错误、漏洞或中断，使用者需自行承担使用风险。{'\n'}</Text>
        <Text selectable style={styles.text} >5.3 由于网络原因、第三方服务（包括但不限于音乐平台服务器、自定义源服务）不稳定或终止服务等原因导致本软件部分或全部功能无法使用的，本软件开发者不承担任何责任。{'\n'}</Text>
        <Text selectable style={styles.bold} >六、使用限制{'\n'}</Text>
        <Text selectable style={styles.text} >6.1 <Text style={styles.bold}>禁止在违反当地法律法规的情况下使用本软件</Text>，对于使用者在明知或不知当地法律法规不允许的情况下使用本软件所造成的任何违法违规行为由使用者承担，本软件开发者不承担由此造成的任何责任。{'\n'}</Text>
        <Text selectable style={styles.text} >6.2 禁止对本软件进行反向工程、反编译、破解或使用任何方式获取本软件源代码（本软件所基于的开源项目源代码除外）。{'\n'}</Text>
        <Text selectable style={styles.text} >6.3 禁止将本软件用于任何违法、侵权或损害第三方合法权益的行为。{'\n'}</Text>
        <Text selectable style={styles.bold} >七、非商业性质{'\n'}</Text>
        <Text selectable style={styles.text} >7.1 本软件完全免费，仅用于对技术可行性的探索及研究，<Text style={styles.bold}>不接受任何商业（包括但不限于广告、付费功能等）合作及捐赠</Text>。{'\n'}</Text>
        <Text selectable style={styles.text} >7.2 若你在使用本软件的过程中遇到广告或者引流（如需要加群、关注公众号、付费等才能使用或升级）的信息，则表明你当前运行的软件是<Text style={styles.bold}>被他人篡改的版本</Text>，与本软件开发者无关。{'\n'}</Text>
        <Text selectable style={styles.bold} >八、开源声明{'\n'}</Text>
        <Text selectable style={styles.text} >8.1 本软件所基于的 LX Music 项目代码已开源发布于 <Text onPress={openSourcePage} style={textLinkStyle}>GitHub</Text>，本软件的修改部分也同样遵循 Apache License 2.0 许可证开源。{'\n'}</Text>
        <Text selectable style={styles.bold} >九、协议接受{'\n'}</Text>
        <Text selectable style={styles.text} >9.1 若你使用本软件，将代表你已充分阅读并理解本协议，且接受本协议全部条款。{'\n'}</Text>
        <Text selectable style={styles.text} >* 若协议更新，恕不另行通知，可到开源地址查看最新版本。</Text>
      </ScrollView>
    </View>
  )
}

const Footer = ({ componentId }: { componentId: string }) => {
  const theme = useTheme()
  const isAgreePact = useSettingValue('common.isAgreePact')
  const [time, setTime] = useState(7)

  const handleReject = () => {
    exitApp()
  }

  const handleConfirm = () => {
    let _isAgreePact = isAgreePact
    if (!isAgreePact) updateSetting({ 'common.isAgreePact': true })
    void Navigation.dismissOverlay(componentId)
    if (!_isAgreePact) {
      setTimeout(() => {
        Alert.alert(
          '',
          Buffer.from('e69cace8bdafe4bbb6e5ae8ce585a8e5858de8b4b9e4b894e5bc80e6ba90efbc8ce5a682e69e9ce4bda0e698afe88ab1e992b1e8b4ade4b9b0e79a84efbc8ce8afb7e79bb4e68ea5e7bb99e5b7aee8af84efbc810a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
          [{
            text: Buffer.from('e5a5bde79a8420284f4b29', 'hex').toString(),
            onPress: () => {
              void checkUpdate()
              void initDeeplink()
            },
          }],
        )
      }, 2e3)
    }
  }


  const confirmBtn = useMemo(() => {
    if (isAgreePact) return { disabled: false, text: '关闭' }
    return time ? { disabled: true, text: `接受（${time}）` } : { disabled: false, text: '接受' }
  }, [isAgreePact, time])

  useEffect(() => {
    if (isAgreePact) return
    const timeoutTools = {
      timeout: null as NodeJS.Timeout | null,
      start() {
        this.timeout = setTimeout(() => {
          setTime(time => {
            time--
            if (time > 0) this.start()
            return time
          })
        }, 1000)
      },
      clear() {
        if (!this.timeout) return
        clearTimeout(this.timeout)
      },
    }
    timeoutTools.start()
    return () => {
      timeoutTools.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {
        isAgreePact
          ? null
          : (
              <Text selectable style={styles.tip} size={13}>若你（使用者）接受以上协议，请点击下面的"接受"按钮签署本协议；若不接受，请点击"不接受"后退出软件并清除本软件的所有数据。</Text>
            )
      }
      <View style={styles.btns}>
        {
          isAgreePact
            ? null
            : (
                <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={handleReject}>
                  <Text color={theme['c-button-font']}>不接受</Text>
                </Button>
              )
        }
        <Button disabled={confirmBtn.disabled} style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={handleConfirm}>
          <Text color={theme['c-button-font']}>{confirmBtn.text}</Text>
        </Button>
      </View>
    </>
  )
}

const PactModal = ({ componentId }: { componentId: string }) => {
  return (
    <ModalContent>
      <Content />
      <Footer componentId={componentId} />
    </ModalContent>
  )
}

const styles = createStyle({
  main: {
    flexShrink: 1,
    marginTop: 15,
    marginBottom: 10,
  },
  content: {
    flexGrow: 0,
    marginLeft: 5,
    marginRight: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 15,
  },
  part: {
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
    marginBottom: 5,
  },
  bold: {
    fontSize: 14,
    textAlignVertical: 'bottom',
    fontWeight: 'bold',
  },
  tip: {
    textAlignVertical: 'bottom',
    fontWeight: 'bold',
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
  },
  btn: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})

export default PactModal
