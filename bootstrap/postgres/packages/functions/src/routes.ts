
import { APIRoutes } from "./api"

import { routes as routes0 } from './routes/greeting-card-func'

export const getRoutes = (): APIRoutes => {
    return [
		...routes0
    ]
}
