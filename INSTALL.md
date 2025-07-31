
# Installing File Downloader on TrueNAS SCALE

This guide will walk you through the process of installing the File Downloader application on TrueNAS SCALE using the Helm chart.

## Prerequisites

- TrueNAS SCALE 22.02.0 or later
- Kubernetes (included with TrueNAS SCALE)
- Helm 3.x installed on your local machine or access to the TrueNAS SCALE web interface
- A dataset created for storing downloaded files (optional)

## Installation Methods

### Method 1: Using the TrueNAS SCALE Web Interface

TrueNAS SCALE includes a built-in Apps system that uses Helm under the hood. To install the File Downloader:

1. In the TrueNAS SCALE web interface, navigate to "Apps"
2. Click "Discover Apps" or "Custom App"
3. For Custom App, select the "Custom App" option and provide:
   - The URL to your Helm chart repository or upload the .tgz file
   - Set the app name (e.g., "file-downloader")

4. Configure the application:
   - Set the host name for the ingress (e.g., "file-downloader.truenas.local")
   - Configure the persistent storage:
     - Either create a new PVC or use an existing dataset
     - Set the mount path to "/downloads"
   - Review other configuration options as needed

5. Click "Install" to deploy the application

6. Once deployed, access the application at the hostname you configured

### Method 2: Using Helm CLI

If you prefer using the Helm CLI directly:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/file-downloader.git
   cd file-downloader
   ```

2. Install the Helm chart:
   ```bash
   helm install file-downloader ./helm-chart \
     --namespace file-downloader \
     --create-namespace \
     --set ingress.hosts[0].host=file-downloader.truenas.local
   ```

   If you want to use an existing dataset for storage:
   ```bash
   helm install file-downloader ./helm-chart \
     --namespace file-downloader \
     --create-namespace \
     --set ingress.hosts[0].host=file-downloader.truenas.local \
     --set persistence.downloads.existingClaim=downloads-dataset
   ```

3. Access the application at the hostname you configured

## Configuration

### Persistent Storage

The application needs a storage location for downloaded files. You have two options:

1. **Automatic PVC Creation**: The Helm chart will automatically create a PVC if no existing claim is specified.

2. **Using an Existing Dataset**: To use a dataset you've already created in TrueNAS:
   - Create a dataset in TrueNAS (e.g., "tank/downloads")
   - In the Apps configuration, select this dataset as the storage location
   - Set the mount path to "/downloads"

### Network Access

By default, the application will be accessible via an Ingress at the hostname you specify. Make sure:

1. Your DNS or local hosts file points the hostname to your TrueNAS SCALE IP address
2. You've configured TrueNAS SCALE to handle incoming traffic properly (port forwarding, etc.)

## Upgrading

To upgrade the application to a newer version:

### Using TrueNAS SCALE Web Interface:
1. Navigate to "Apps"
2. Find your File Downloader installation
3. Click "Upgrade" and follow the prompts

### Using Helm CLI:
```bash
helm upgrade file-downloader ./helm-chart \
  --namespace file-downloader
```

## Uninstallation

### Using TrueNAS SCALE Web Interface:
1. Navigate to "Apps"
2. Find your File Downloader installation
3. Click "Uninstall"

### Using Helm CLI:
```bash
helm uninstall file-downloader --namespace file-downloader
```

**Note**: This will not delete the persistent volume containing your downloaded files.

## Troubleshooting

If you encounter issues:

1. Check the pod logs:
   ```bash
   kubectl logs -n file-downloader -l app.kubernetes.io/name=file-downloader
   ```

2. Verify the pods are running:
   ```bash
   kubectl get pods -n file-downloader
   ```

3. Check the persistent volume claim:
   ```bash
   kubectl get pvc -n file-downloader
   ```

4. Ensure the ingress is correctly configured:
   ```bash
   kubectl get ingress -n file-downloader
   ```

For more detailed troubleshooting, consult the TrueNAS SCALE documentation.
