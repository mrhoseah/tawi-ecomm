"use client";

import { Shield, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/cp/PageHeader";
import { ROLES, ROLE_KEYS } from "@/lib/roles";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminRolesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Roles & Permissions"
        icon={Shield}
        description="Role definitions and access levels"
      />

      <div className="space-y-6">
        {ROLE_KEYS.map((key) => {
          const role = ROLES[key];
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {role.label}
                        <Badge variant={role.variant} className="font-normal">
                          {role.key}
                        </Badge>
                        {role.isStaff && (
                          <Badge variant="outline" className="font-normal text-xs">
                            Staff
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        {role.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Permissions
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {role.permissions.map((p) => (
                      <li
                        key={p}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-sm text-muted-foreground"
                      >
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role hierarchy</CardTitle>
          <CardDescription>
            Administrator has full access. Support Staff has limited write access. Customers use the storefront only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="default">Administrator</Badge>
            <span>→</span>
            <Badge variant="secondary">Support Staff</Badge>
            <span>→</span>
            <Badge variant="outline">Customer</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
