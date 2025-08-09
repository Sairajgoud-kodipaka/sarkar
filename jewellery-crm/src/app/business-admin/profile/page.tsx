'use client';
import React from 'react';
import { Card } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">My Profile</h1>
      <Card className="p-6">
        <p className="text-text-secondary mb-2">View and update your profile information, password, and preferences here.</p>
        {/* TODO: Integrate profile form and actions */}
      </Card>
    </div>
  );
}
 
 