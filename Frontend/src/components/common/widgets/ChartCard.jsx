import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/Card'
import { cn } from '@/utils/cn'

/**
 * Chart card — header (title, subtitle, actions) + chart body.
 */
export function ChartCard({ title, description, icon: Icon, action, children, className, bodyClassName, ...props }) {
  return (
    <Card variant="default" radius="lg" padding="none" className={cn('overflow-hidden transition-shadow hover:shadow-medium', className)} {...props}>
      <CardHeader className="flex-row items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="size-4 text-muted" /> : null}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('px-3 pb-4 pt-3', bodyClassName)}>{children}</CardContent>
    </Card>
  )
}

export default ChartCard
