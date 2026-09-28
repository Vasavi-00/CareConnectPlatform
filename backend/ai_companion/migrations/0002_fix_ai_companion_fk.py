from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_cleanup_old_elderprofile_columns'),
        ('ai_companion', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='AIConversation',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('title', models.CharField(default='Daily Companion Chat', max_length=255)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('elder', models.ForeignKey(db_column='elder_id', on_delete=django.db.models.deletion.CASCADE, related_name='ai_conversations', to='accounts.elderprofile')),
                    ],
                    options={
                        'db_table': 'ai_companion_aiconversation',
                        'ordering': ['-updated_at'],
                    },
                ),
                migrations.CreateModel(
                    name='AIMessage',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('sender', models.CharField(max_length=20)),
                        ('content', models.TextField()),
                        ('is_private', models.BooleanField(default=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('conversation', models.ForeignKey(db_column='conversation_id', on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='ai_companion.aiconversation')),
                    ],
                    options={
                        'db_table': 'ai_companion_aimessage',
                        'ordering': ['created_at'],
                    },
                ),
                migrations.CreateModel(
                    name='FamilyCallRequest',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('reason', models.CharField(max_length=255)),
                        ('status', models.CharField(default='PENDING', max_length=50)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('elder', models.ForeignKey(db_column='elder_id', on_delete=django.db.models.deletion.CASCADE, related_name='family_call_requests', to='accounts.elderprofile')),
                        ('requested_to', models.ForeignKey(blank=True, db_column='requested_to_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_call_requests', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'ai_companion_familycallrequest',
                        'ordering': ['-created_at'],
                    },
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE ai_companion_aiconversation
                        DROP CONSTRAINT IF EXISTS ai_companion_aiconve_elder_id_a56ccff0_fk_accounts_;

                        ALTER TABLE ai_companion_aiconversation
                        DROP CONSTRAINT IF EXISTS ai_companion_aiconversation_elder_id_fk_accounts_elderprofile_id;

                        ALTER TABLE ai_companion_aiconversation
                        ADD CONSTRAINT ai_companion_aiconversation_elder_id_fk_accounts_elderprofile_id
                        FOREIGN KEY (elder_id)
                        REFERENCES accounts_elderprofile(id)
                        ON DELETE CASCADE
                        DEFERRABLE INITIALLY DEFERRED;

                        ALTER TABLE ai_companion_familycallrequest
                        DROP CONSTRAINT IF EXISTS ai_companion_familyc_elder_id_b2a82c14_fk_accounts_;

                        ALTER TABLE ai_companion_familycallrequest
                        DROP CONSTRAINT IF EXISTS ai_companion_familycallrequest_elder_id_fk_accounts_elderprofile_id;

                        ALTER TABLE ai_companion_familycallrequest
                        ADD CONSTRAINT ai_companion_familycallrequest_elder_id_fk_accounts_elderprofile_id
                        FOREIGN KEY (elder_id)
                        REFERENCES accounts_elderprofile(id)
                        ON DELETE CASCADE
                        DEFERRABLE INITIALLY DEFERRED;
                    """,
                    reverse_sql="""
                        -- Reverse SQL
                    """
                )
            ]
        ),
    ]
