import { Card, CardContent, CardHeader } from "@/components/ui/card"

const pulse = "animate-pulse rounded-md bg-muted"

export function EmpresaSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
            <Card>
                <CardHeader>
                    <div className={`${pulse} h-4 w-36`} />
                    <div className={`${pulse} h-3 w-48`} />
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className={`${pulse} h-52 w-full rounded-xl`} />
                    <div className={`${pulse} h-8 w-full`} />
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className={`${pulse} h-4 w-40`} />
                        <div className={`${pulse} h-3 w-56`} />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-5">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="space-y-1.5">
                                    <div className={`${pulse} h-3 w-24`} />
                                    <div className={`${pulse} h-9 w-full`} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className={`${pulse} h-4 w-44`} />
                        <div className={`${pulse} h-3 w-48`} />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-5">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="space-y-1.5">
                                    <div className={`${pulse} h-3 w-20`} />
                                    <div className={`${pulse} h-9 w-full`} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
