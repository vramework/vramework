import React from 'react'
import SVG from 'react-inlinesvg'

type DefaultIconKeys = 'info' | 'user' | 'generic'
const defaultIcons: Record<DefaultIconKeys, React.ReactElement | null> = {
    info:  null,
    user: null,
    generic: null
}

export const useSVG = (svgName: string, color = 'currentColor', defaultIcon: DefaultIconKeys = 'generic', className: string = 'w-4 h-4') => {
    return <SVG
        className={className}
        src={`/svg/${svgName}`}
        cacheRequests={true}
        loader={defaultIcons[defaultIcon] || null}
        preProcessor={code => code.replace(/fill=".*?"/g, `fill="${color}"`).replace(/width=".*?"/g, '').replace(/height=".*?"/g, '')}
    />
}
