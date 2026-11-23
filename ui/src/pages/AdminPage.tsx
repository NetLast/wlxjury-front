import { useState } from 'react'
import { Alert, Container, Tab, Tabs } from '@mui/material'
import TopBar from '../components/TopBar'
import ContestsGrid from '../components/ContestsGrid'
import { USE_MOCK } from '../api/baseQuery'
import CampaignsTab from './admin/CampaignsTab'
import NewCampaignTab from './admin/NewCampaignTab'
import StatsTab from './admin/StatsTab'

/** Admin: campaigns and their photos, statistics, new campaign, contest settings. */
export default function AdminPage() {
  const [tab, setTab] = useState(0)
  return (
    <>
      <TopBar title="Адміністратор" />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
          <Tab label="Кампанії та фото" />
          <Tab label="Статистика" />
          <Tab label="Нова кампанія" />
          <Tab label="Налаштування конкурсів" />
        </Tabs>
        {tab === 0 && <CampaignsTab />}
        {tab === 1 && <StatsTab />}
        {tab === 2 && <NewCampaignTab />}
        {tab === 3 && (USE_MOCK
          ? <Alert severity="info">Таблиця налаштувань працює з реальним бекендом (REST /api/contests).</Alert>
          : <ContestsGrid />)}
      </Container>
    </>
  )
}
