import React from 'react'

export interface ButtonProps {
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"]
    title?: string
    onClick?: VoidFunction
    className?: string
    disabled?: boolean
}

export const useAsyncButton = (Button: React.FunctionComponent<ButtonProps>, className: string, content: React.ReactElement | string, disabled: boolean, onClick: () => Promise<unknown>) => {
    const [state, setState] = React.useState<'initial' | 'saving' | 'saved'>('initial')
    const singleClick = React.useCallback(async () => {
        setState('saving')
        await Promise.all([
          new Promise(resolve => setTimeout(resolve, 500)),
          await onClick()
        ])
        try {
          setState('saved')
          await new Promise(resolve => setTimeout(resolve, 250))
          setState('initial')
        } catch (e) {
          // Probably already unmounted
        }
    }, [onClick])
  return {
    state,
    button: <Button
      disabled={state === 'saved' || disabled}
      className={className}
      onClick={singleClick}
    >
      {content}
    </Button>
  }
}

