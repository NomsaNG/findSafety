"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    description?: string
  }
>(({ className, title, description, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-1", className)} {...props}>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

interface ChartTooltipContentProps {
  className?: string
  items: {
    name: string
    color: string
    valueFormatter?: (value: number) => string
  }[]
}

const ChartTooltipContent = ({ className, items }: ChartTooltipContentProps) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      {items.map((item) => (
        <div key={item.name} className="flex items-center space-x-2">
          <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-xs font-medium">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

interface ChartLegendProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChartLegend = React.forwardRef<HTMLDivElement, ChartLegendProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("flex items-center space-x-4", className)} {...props} />
})
ChartLegend.displayName = "ChartLegend"

interface ChartLegendItemProps {
  name: string
  color: string
}

const ChartLegendItem = ({ name, color }: ChartLegendItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-medium">{name}</span>
    </div>
  )
}

const Chart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("", className)} {...props} />
})
Chart.displayName = "Chart"

const ChartTooltip = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("", className)} {...props} />
  },
)
ChartTooltip.displayName = "ChartTooltip"

export { Chart, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendItem }
