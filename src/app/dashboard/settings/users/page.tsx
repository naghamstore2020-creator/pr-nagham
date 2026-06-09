"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, createUser, changePassword, toggleUserActive } from "@/actions/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Users, ShieldAlert, UserPlus, Loader2, KeyRound } from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  role: "ADMIN" | "DEMO";
  isActive: boolean;
  createdAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "DEMO">("DEMO");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data as UserItem[]);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers() }, [loadUsers]);

  const handleCreate = async () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    setCreating(true);
    setError("");
    const res = await createUser(newUsername.trim(), newPassword, newRole);
    if (res.success) {
      setNewUsername("");
      setNewPassword("");
      setNewRole("DEMO");
      await loadUsers();
    } else {
      setError(res.error || "فشل إنشاء المستخدم");
    }
    setCreating(false);
  };

  const handleToggle = async (userId: string, current: boolean) => {
    const res = await toggleUserActive(userId, !current);
    if (res.success) await loadUsers();
  };

  const handlePasswordChange = async (userId: string) => {
    if (!passwordValue.trim()) return;
    setPasswordUpdating(true);
    const res = await changePassword(userId, passwordValue);
    if (res.success) {
      setPasswordUserId(null);
      setPasswordValue("");
    }
    setPasswordUpdating(false);
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DEMO: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">إدارة المستخدمين</h1>
        <p className="text-zinc-400 text-xs mt-1">إضافة وتعطيل المستخدمين وتحديد صلاحياتهم.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">المستخدمون الحاليون</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">{users.length} مستخدم</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-zinc-500" /></div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">لا يوجد مستخدمون</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold">
                      <th className="pb-3 pr-4">اسم المستخدم</th>
                      <th className="pb-3">الصلاحية</th>
                      <th className="pb-3">تاريخ التسجيل</th>
                      <th className="pb-3">الحالة</th>
                      <th className="pb-3 pl-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm text-zinc-300">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-3.5 pr-4 font-medium text-white">{user.username}</td>
                        <td className="py-3.5">
                          <Badge className={roleColors[user.role]} variant="outline">
                            {user.role === "ADMIN" ? "مدير النظام" : "مستخدم تجريبي"}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-xs text-zinc-400">{new Date(user.createdAt).toLocaleString("ar-SA")}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs ${user.isActive ? "text-emerald-400" : "text-red-400"}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                            {user.isActive ? "نشط" : "موقف"}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4">
                          <div className="flex items-center gap-2">
                            {passwordUserId === user.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="password"
                                  value={passwordValue}
                                  onChange={(e) => setPasswordValue(e.target.value)}
                                  className="w-28 h-7 text-xs bg-zinc-800 border-zinc-700 text-white"
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handlePasswordChange(user.id)}
                                  disabled={passwordUpdating || !passwordValue.trim()}
                                  className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                >
                                  {passwordUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setPasswordUserId(null); setPasswordValue(""); }}
                                  className="h-7 px-2 text-xs text-zinc-400"
                                >
                                  إلغاء
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => handleToggle(user.id, user.isActive)}
                                  className="data-[state=checked]:bg-emerald-600"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setPasswordUserId(user.id)}
                                  className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-200"
                                >
                                  <KeyRound className="w-3 h-3 ml-1" />
                                  كلمة السر
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/30 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <ShieldAlert className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-white">إضافة مستخدم</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">إنشاء حساب جديد</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">اسم المستخدم</Label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="bg-zinc-800/50 border-zinc-700 text-white text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">كلمة المرور</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="bg-zinc-800/50 border-zinc-700 text-white text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">الصلاحية</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newRole === "DEMO" ? "default" : "outline"}
                  className={`text-xs flex-1 ${newRole === "DEMO" ? "bg-blue-600" : "border-zinc-700 text-zinc-400"}`}
                  onClick={() => setNewRole("DEMO")}
                >
                  مستخدم تجريبي
                </Button>
                <Button
                  type="button"
                  variant={newRole === "ADMIN" ? "default" : "outline"}
                  className={`text-xs flex-1 ${newRole === "ADMIN" ? "bg-amber-600" : "border-zinc-700 text-zinc-400"}`}
                  onClick={() => setNewRole("ADMIN")}
                >
                  مدير النظام
                </Button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              onClick={handleCreate}
              disabled={creating || !newUsername.trim() || !newPassword.trim()}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              {creating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <UserPlus className="w-4 h-4 ml-2" />}
              إنشاء مستخدم
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
