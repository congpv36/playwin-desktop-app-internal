import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import BetList from '@renderer/pages/BetList'
import ContraList from '@renderer/pages/ContraList'
import LeagueFilter from '@renderer/pages/LeagueFilter'
import LeaguePointRandomizer from '@renderer/pages/LeaguePointRandomizer'
import ProgramSetting from '@renderer/pages/ProgramSetting'
import SportsBook from '@renderer/pages/SportsBook'
import SuccessList from '@renderer/pages/SuccessList'
import WaitingList from '@renderer/pages/WaitingList'
import { Path } from '@renderer/route/Path'
import InitApp from '@renderer/windows/InitApp'
import Login from '@renderer/windows/Login'
import Main from '@renderer/windows/Main'

import BetSetting from '@renderer/components/ProgramSetting/BetSetting'
import GeneralSetting from '@renderer/components/ProgramSetting/GeneralSetting'
import Language from '@renderer/components/ProgramSetting/Language'
import { PlatformPair } from '@renderer/components/ProgramSetting/PlatformPair'
import ProxyServerSettingsGeneral from '@renderer/components/ProgramSetting/ProxyServerSettingsGeneral'
import { SportsBookTab } from '@renderer/components/SportsBook/SportsBookTab'
import { BetSettingProvider } from '@renderer/context/BetSettingContext'
import { LeagueFilterProvider } from '@renderer/context/LeagueFilterContext'
import { LeaguePointRandomizerProvider } from '@renderer/context/LeaguePointRandomizerContext'
import { PlatformPairProvider } from '@renderer/context/PlatformPairContext'
import { SettingProvider } from '@renderer/context/SettingContext'

function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path={Path.main} element={<Main />}>
          <Route index element={<Navigate to="sports-book/sports-book1" replace />} />
          <Route path="sports-book" element={<SportsBook />}>
            <Route index element={<Navigate to="sports-book1" replace />} />
            <Route path=":id" element={<SportsBookTab />} />
          </Route>
          <Route path="bet-list" element={<BetList />} />
          <Route path="waiting-list" element={<WaitingList />} />
          <Route path="contra-list" element={<ContraList />} />
          <Route path="success-list" element={<SuccessList />} />
          <Route
            path="league-filter"
            element={
              <LeagueFilterProvider>
                <LeagueFilter />
              </LeagueFilterProvider>
            }
          />
          <Route
            path="league-point-randomizer"
            element={
              <LeaguePointRandomizerProvider>
                <LeaguePointRandomizer />
              </LeaguePointRandomizerProvider>
            }
          />
          <Route path="program-settings" element={<ProgramSetting />}>
            <Route index element={<Navigate to="general-setting" replace />} />
            <Route
              path="general-setting"
              element={
                <SettingProvider>
                  <GeneralSetting />
                </SettingProvider>
              }
            />
            <Route
              path="bet-setting"
              element={
                <BetSettingProvider>
                  <BetSetting />
                </BetSettingProvider>
              }
            />
            <Route
              path="platform-pair"
              element={
                <PlatformPairProvider>
                  <PlatformPair />
                </PlatformPairProvider>
              }
            />

            <Route path="proxy-setting" element={<ProxyServerSettingsGeneral />} />
            <Route path="language" element={<Language />} />
          </Route>
        </Route>

        <Route path={Path.login} element={<Login />} />
        <Route path={Path.initApp} element={<InitApp />} />
      </Routes>
    </HashRouter>
  )
}

export default Router
