
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medicines', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='medicine',
            options={'ordering': ['name', 'start_date']},
        ),
        migrations.RemoveField(
            model_name='medicine',
            name='instructions',
        ),
        migrations.RemoveField(
            model_name='medicine',
            name='scheduled_time',
        ),
        migrations.AddField(
            model_name='medicine',
            name='doses_per_day',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='medicine',
            name='food_timing',
            field=models.CharField(default='ANY', max_length=10),
        ),
        migrations.AddField(
            model_name='medicine',
            name='frequency',
            field=models.CharField(default='ONCE_DAILY', max_length=20),
        ),
        migrations.AddField(
            model_name='medicine',
            name='low_stock_threshold',
            field=models.PositiveIntegerField(default=5),
        ),
        migrations.AddField(
            model_name='medicine',
            name='notes',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='medicine',
            name='purchase_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='medicine',
            name='times',
            field=models.JSONField(default=list),
        ),
        migrations.AlterField(
            model_name='medicine',
            name='dosage',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='medicine',
            name='name',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='medicine',
            name='quantity',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
