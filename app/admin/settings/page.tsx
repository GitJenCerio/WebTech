'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

interface SettingsData {
  businessName: string;
  reservationFee: number;
  adminCommissionRate: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderHoursBefore: number;
}

const DEFAULT_SETTINGS: SettingsData = {
  businessName: 'Glammed Nails by Jhen',
  reservationFee: 500,
  adminCommissionRate: 10,
  emailNotifications: true,
  smsNotifications: false,
  reminderHoursBefore: 24,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            businessName: data.businessName ?? DEFAULT_SETTINGS.businessName,
            reservationFee: data.reservationFee ?? DEFAULT_SETTINGS.reservationFee,
            adminCommissionRate: data.adminCommissionRate ?? DEFAULT_SETTINGS.adminCommissionRate,
            emailNotifications: data.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
            smsNotifications: data.smsNotifications ?? DEFAULT_SETTINGS.smsNotifications,
            reminderHoursBefore: data.reminderHoursBefore ?? DEFAULT_SETTINGS.reminderHoursBefore,
          });
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: settings.businessName,
          reservationFee: settings.reservationFee,
          adminCommissionRate: settings.adminCommissionRate,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('General settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          reminderHoursBefore: settings.reminderHoursBefore,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border border-[#e5e5e5] rounded-xl p-6 animate-pulse">
          <div className="h-6 w-48 rounded bg-[#e5e5e5] mb-4" />
          <div className="space-y-4">
            <div className="h-10 w-full rounded bg-[#e5e5e5]" />
            <div className="h-10 w-32 rounded bg-[#e5e5e5]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a1a]">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your business and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-[#f5f5f5]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="border border-[#e5e5e5] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">General</CardTitle>
              <CardDescription>Business name and reservation fee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings((s) => ({ ...s, businessName: e.target.value }))}
                  placeholder="Your business name"
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservationFee">Reservation Fee (₱)</Label>
                <Input
                  id="reservationFee"
                  type="number"
                  min={0}
                  value={settings.reservationFee}
                  onChange={(e) => setSettings((s) => ({ ...s, reservationFee: Number(e.target.value) || 0 }))}
                  placeholder="500"
                  className="max-w-[140px]"
                />
                <p className="text-xs text-gray-500">Amount required as deposit for bookings</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminCommissionRate">Admin Commission Rate (%)</Label>
                <Input
                  id="adminCommissionRate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={settings.adminCommissionRate}
                  onChange={(e) => setSettings((s) => ({ ...s, adminCommissionRate: Number(e.target.value) || 0 }))}
                  placeholder="10"
                  className="max-w-[120px]"
                />
                <p className="text-xs text-gray-500">Applied to Total Invoice for commission calculation in finance exports</p>
              </div>
              <Button onClick={handleSaveGeneral} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card className="border border-[#e5e5e5] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Services</CardTitle>
              <CardDescription>Manage service types and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Service pricing is managed via the pricing spreadsheet. For quotation and booking services, visit the{' '}
                <Link href="/admin/quotation" className="text-[#1a1a1a] underline">
                  Quotation
                </Link>{' '}
                page.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border border-[#e5e5e5] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Email and reminder preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-gray-500">Send booking confirmation and reminder emails</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-xs text-gray-500">Send SMS reminders (requires SMS integration)</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, smsNotifications: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderHours">Reminder (hours before appointment)</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min={1}
                  max={168}
                  value={settings.reminderHoursBefore}
                  onChange={(e) => setSettings((s) => ({ ...s, reminderHoursBefore: Number(e.target.value) || 24 }))}
                  className="max-w-[100px]"
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="border border-[#e5e5e5] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Team</CardTitle>
              <CardDescription>Manage staff and nail techs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin/staff">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Staff / Users
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/nail-techs">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Nail Techs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
