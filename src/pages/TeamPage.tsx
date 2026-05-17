import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWarehouse } from '../contexts/WarehouseContext';
import { supabase } from '../lib/supabaseClient';
import { showToast } from '../components/Toast';
import { ArrowLeft, UserPlus, Users, Crown, Trash2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Member {
  id: string;
  user_id: string;
  invited_email: string | null;
  joined_at: string;
}

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { warehouse } = useWarehouse();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);

  const isOwner = warehouse?.owner_id === user?.id;

  const fetchMembers = async () => {
    if (!warehouse) return;
    setLoading(true);
    const { data } = await supabase
      .from('warehouse_members')
      .select('*')
      .eq('warehouse_id', warehouse.id)
      .order('joined_at');
    if (data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [warehouse]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse || !inviteEmail.trim()) return;

    const email = inviteEmail.trim().toLowerCase();

    // Check if already a member
    const alreadyMember = members.find(m => m.invited_email?.toLowerCase() === email);
    if (alreadyMember) {
      showToast('error', 'This email is already a member.');
      return;
    }

    setInviting(true);
    try {
      // Look up if the user exists in auth
      // We can't query auth.users directly from client, so we try to add by email
      // If user exists, we find them via a lookup approach
      const { data: existingMembers } = await supabase
        .from('warehouse_members')
        .select('user_id')
        .eq('warehouse_id', warehouse.id);

      // Try to find the user by checking if there's a user with this email
      // We'll insert with user_id if found, otherwise just invited_email for pending
      // Since we can't query auth.users from client, we use a workaround:
      // Insert with a placeholder and the email, the user will be linked when they log in

      // First, check if there's already a member entry for this warehouse with this email
      const { data: existing } = await supabase
        .from('warehouse_members')
        .select('id')
        .eq('warehouse_id', warehouse.id)
        .eq('invited_email', email);

      if (existing && existing.length > 0) {
        showToast('error', 'This email is already invited.');
        setInviting(false);
        return;
      }

      // For now, we need the user to exist to add them (since user_id is required)
      // Let's use a database function approach or look up users differently
      // Simple approach: try to find user via RPC or just show info
      
      // Since we need user_id (NOT NULL), we need the user to already have signed up
      // We'll create a simple check - the user types an email, we look for existing users
      // through a lightweight approach

      // Attempt to insert — if user doesn't exist yet, we'll need to handle it
      // For MVP: inform user that the person must sign up first, then share the warehouse
      
      // Let's try a practical approach: search for the user in warehouse_members of OTHER warehouses
      // Actually the simplest secure approach: create an RPC function
      // But for now, let's use a simpler method with auth admin functions

      // Simplest working approach: use the Supabase profiles or just try inserting
      // We'll create a function to handle this server-side

      // For now, let's use a direct approach with a function
      const { data, error } = await supabase.rpc('invite_user_to_warehouse', {
        p_warehouse_id: warehouse.id,
        p_email: email,
      });

      if (error) {
        // If the function doesn't exist yet, fall back to manual message
        if (error.message.includes('function') || error.code === '42883') {
          showToast('error', 'Invite function not set up. See instructions below.');
        } else {
          showToast('error', error.message);
        }
      } else {
        showToast('success', `Invited ${email} successfully!`);
        setInviteEmail('');
        fetchMembers();
      }
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to invite.');
    }
    setInviting(false);
  };

  const handleRemove = async () => {
    if (!removeTarget || !warehouse) return;
    try {
      const { error } = await supabase
        .from('warehouse_members')
        .delete()
        .eq('id', removeTarget.id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== removeTarget.id));
      showToast('success', 'Member removed.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to remove member.');
    }
    setRemoveTarget(null);
  };

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '20px' }}>Team</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{warehouse?.name}</p>
        </div>
      </div>

      {/* Invite Section */}
      {isOwner && (
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} /> Invite Member
          </h3>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="email"
                placeholder="member@email.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 10px 10px 36px', border: '1px solid var(--color-border)',
                  borderRadius: '8px', background: 'var(--color-bg)', fontSize: '14px'
                }}
              />
            </div>
            <button type="submit" disabled={inviting} className="btn btn-primary"
              style={{ width: 'auto', padding: '10px 16px', fontSize: '14px' }}>
              {inviting ? '...' : 'Invite'}
            </button>
          </form>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            The user must have an existing account. They'll see this warehouse after being invited.
          </p>
        </div>
      )}

      {/* Members List */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: '600' }}>Members ({members.length})</h3>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : (
        members.map(member => {
          const isSelf = member.user_id === user?.id;
          const isMemberOwner = member.user_id === warehouse?.owner_id;

          return (
            <div key={member.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Avatar */}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: isMemberOwner ? '#eff6ff' : '#f8fafc',
                color: isMemberOwner ? 'var(--color-primary)' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '16px', flexShrink: 0
              }}>
                {isMemberOwner ? <Crown size={18} /> : (member.invited_email?.[0]?.toUpperCase() || '?')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.invited_email || 'Unknown'}
                  </span>
                  {isSelf && <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>(You)</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {isMemberOwner ? 'Owner' : 'Member'} · Joined {new Date(member.joined_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Remove Button (owner only, can't remove self) */}
              {isOwner && !isSelf && (
                <button onClick={() => setRemoveTarget(member)}
                  style={{ padding: '8px', color: 'var(--color-danger)', borderRadius: '8px' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Member"
        message={`Remove ${removeTarget?.invited_email || 'this member'} from ${warehouse?.name}? They will lose access to all data in this warehouse.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        danger
      />
    </div>
  );
};
