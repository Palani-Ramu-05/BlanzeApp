import { usePageTitle } from '@core/hooks/usePageTitle'
import { WeatherExperience } from '../components/WeatherExperience'

export const WeatherPage = () => {
  usePageTitle('Weather Intelligence')
  return <WeatherExperience />
}
